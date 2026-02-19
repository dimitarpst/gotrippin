import https from "node:https";
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;

// Bucket "cdn" → URLs: cdn.gotrippin.app/avatars/... and cdn.gotrippin.app/trip-images/...
export const AVATARS_BUCKET = "cdn";
export const TRIP_IMAGES_KEY_PREFIX = "trip-images/";
export const TRIP_IMAGES_BUCKET = AVATARS_BUCKET;

/** Custom HTTPS agent to avoid TLS handshake failures on Windows with Cloudflare R2 */
const httpsAgent = new https.Agent({
  keepAlive: true,
  minVersion: "TLSv1.2",
  maxVersion: "TLSv1.3",
});

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({
    httpsAgent,
  }),
});

/**
 * Build a public URL for an object in R2.
 * Uses NEXT_PUBLIC_R2_PUBLIC_URL only — your custom domain (e.g. https://cdn.gotrippin.app).
 *
 * Per Cloudflare R2 docs (https://developers.cloudflare.com/r2/buckets/public-buckets/):
 * - r2.dev is rate-limited and for development only; do not use in production.
 * - Use a custom domain for production; disable "Public development URL" on the bucket.
 * - WAF, caching, and access control require a custom domain (not available on r2.dev).
 */
export function getR2PublicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
  if (!base) return key;
  return `${base.replace(/\/$/, "")}/${key}`;
}
