import type { Trip } from "@gotrippin/core";

/** Normalize R2 keys for comparison (trim, strip leading slashes). */
export function normalizeStorageKeyForCompare(key: string): string {
  return key.trim().replace(/^\/+/, "");
}

/**
 * Read trip cover `storage_key` from API-shaped `cover_photo` (object or occasional array from PostgREST).
 */
export function tripCoverStorageKey(trip: Trip): string | null {
  const raw: unknown = trip.cover_photo;
  if (raw === null || raw === undefined) {
    return null;
  }
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object" || !("storage_key" in row)) {
    return null;
  }
  const k = (row as { storage_key: unknown }).storage_key;
  if (typeof k !== "string" || !k.trim()) {
    return null;
  }
  return normalizeStorageKeyForCompare(k);
}

export function tripCoverBlurHash(trip: Trip): string | null {
  const raw: unknown = trip.cover_photo;
  if (raw === null || raw === undefined) {
    return null;
  }
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object" || !("blur_hash" in row)) {
    return null;
  }
  const h = (row as { blur_hash: unknown }).blur_hash;
  return typeof h === "string" && h.length > 0 ? h : null;
}

export function galleryImageStorageKey(key: string): string {
  return normalizeStorageKeyForCompare(key);
}
