/**
 * Configure CORS on the R2 "cdn" bucket (avatars + trip-images keys).
 * Custom domain: cdn.gotrippin.app. Run: npx tsx scripts/setup-r2-cors.ts
 *
 * If you get AccessDenied: R2 API tokens often can't change bucket CORS. Set CORS in
 * Cloudflare dashboard: R2 → cdn → Settings → CORS policy (origins: localhost, gotrippin.app).
 * Loads R2_* from .env.local (or set them in the shell).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function main() {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: "cdn",
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "HEAD"],
            AllowedOrigins: [
              "http://localhost:3000",
              "http://127.0.0.1:3000",
              "https://gotrippin.app",
              "https://www.gotrippin.app",
            ],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );
  console.log("CORS configured for cdn bucket.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
