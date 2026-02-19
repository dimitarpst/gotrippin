/**
 * One-time migration: download existing trip image_url (Unsplash) → R2, create photos rows,
 * update trips.cover_photo_id, null out image_url.
 *
 * Run from apps/web: npx tsx scripts/migrate-trip-images.ts
 * Requires: apps/web/.env.local (R2 creds) + apps/backend/.env (Unsplash + Supabase service role)
 */

import { resolve } from "node:path";
import https from "node:https";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";

// Load web .env.local then backend .env (no-override so first wins)
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });
dotenvConfig({ path: resolve(process.cwd(), "../backend/.env") });

// ── Config ────────────────────────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

for (const [k, v] of Object.entries({ R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, UNSPLASH_ACCESS_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1); }
}

const BUCKET = "cdn";
const DELAY_MS = 200; // polite delay between downloads

// ── Clients ───────────────────────────────────────────────────────────────────

const httpsAgent = new https.Agent({ keepAlive: true, minVersion: "TLSv1.2", maxVersion: "TLSv1.3" });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  requestHandler: new NodeHttpHandler({ httpsAgent }),
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract the URL slug from an Unsplash image URL (used as unsplash_photo_id for dedup).
 * Note: the URL slug is NOT the same as the Unsplash API photo ID.
 * For new photos, the API ID comes from the search results and is stored directly.
 */
function extractUnsplashSlug(url: string): string | null {
  const m = url.match(/unsplash\.com\/photo-([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function downloadImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${url}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

async function uploadToR2(key: string, buffer: Buffer, contentType: string) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch all trips with image_url
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id, title, image_url")
    .not("image_url", "is", null)
    .neq("image_url", "");

  if (tripsError) { console.error("Failed to fetch trips:", tripsError); process.exit(1); }
  if (!trips?.length) { console.log("No trips with image_url found. Nothing to migrate."); return; }

  console.log(`Found ${trips.length} trips to migrate.\n`);

  let success = 0;
  let failed = 0;

  for (const trip of trips) {
    console.log(`\n[${trip.title}] (${trip.id})`);

    // Note: URL slug (e.g. "1613395877344-13d4a8e0d49e") ≠ Unsplash API photo ID.
    // We use the slug as unsplash_photo_id for deduplication within migrated trips.
    // New photos (via BackgroundPicker) will store the real API ID.
    const slug = extractUnsplashSlug(trip.image_url);
    if (!slug) {
      console.warn(`  ⚠ Could not extract slug from URL: ${trip.image_url}`);
      failed++;
      continue;
    }
    console.log(`  Slug: ${slug}`);

    try {
      // 2. Check if photo already exists in DB (dedup by slug)
      const { data: existing } = await supabase
        .from("photos")
        .select("id")
        .eq("unsplash_photo_id", slug)
        .maybeSingle();

      let photoId: string;

      if (existing) {
        photoId = existing.id;
        console.log(`  → Photo already in DB (${photoId}), reusing.`);
      } else {
        const storageKey = `trip-images/${slug}.jpg`;

        // 3. Download directly from Unsplash CDN URL (no API call needed for the image itself)
        await sleep(DELAY_MS);
        console.log(`  Downloading ${trip.image_url.slice(0, 80)}...`);
        const { buffer, contentType } = await downloadImageBuffer(trip.image_url);
        await uploadToR2(storageKey, buffer, contentType);
        console.log(`  Uploaded to R2: ${storageKey}`);

        // 4. Insert photos row (no blur_hash/photographer — unavailable without API photo ID)
        const { data: photo, error: insertError } = await supabase
          .from("photos")
          .insert({
            storage_key: storageKey,
            source: "unsplash",
            unsplash_photo_id: slug,
          })
          .select("id")
          .single();

        if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);
        photoId = photo.id;
        console.log(`  Created photos row (${photoId})`);
      }

      // 5. Update trip
      const { error: updateError } = await supabase
        .from("trips")
        .update({ cover_photo_id: photoId, image_url: null })
        .eq("id", trip.id);

      if (updateError) throw new Error(`Trip update failed: ${updateError.message}`);
      console.log(`  ✓ Trip updated — cover_photo_id set, image_url cleared.`);
      success++;
    } catch (err) {
      console.error(`  ✗ Error:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n── Migration complete ──`);
  console.log(`  Success: ${success}  Failed: ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
