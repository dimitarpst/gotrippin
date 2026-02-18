/**
 * Resolve an avatar value to a full URL.
 *
 * Values that are already full URLs (http/https) pass through unchanged.
 * Values that look like R2 keys (e.g. "avatars/uid/file.jpg") get prefixed
 * with the public R2 base URL.
 *
 * Works on both server and client because the env var is public.
 */

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

export function resolveAvatarUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (!R2_PUBLIC_URL) return value;
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${value}`;
}
