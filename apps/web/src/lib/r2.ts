import https from "node:https";
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;

export const AVATARS_BUCKET = "avatars";
export const TRIP_IMAGES_BUCKET = "trip-images";

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
 * Base from NEXT_PUBLIC_R2_PUBLIC_URL (e.g. r2.dev for dev, cdn.gotrippin.app for prod).
 */
export function getR2PublicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
  if (!base) return key;
  return `${base.replace(/\/$/, "")}/${key}`;
}
