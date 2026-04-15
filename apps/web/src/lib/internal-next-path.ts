/**
 * Allow only same-origin relative paths for post-login redirects (open-redirect hardening).
 */
export function sanitizeInternalNextPath(next: string | undefined | null): string | null {
  if (next === undefined || next === null || typeof next !== "string") {
    return null;
  }
  const t = next.trim();
  if (t.length === 0 || !t.startsWith("/") || t.startsWith("//")) {
    return null;
  }
  return t;
}
