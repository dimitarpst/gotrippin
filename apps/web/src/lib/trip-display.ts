/**
 * Primary trip label: user-editable title first, then destination.
 * Defined in the web app so the client bundle always resolves a real function
 * (workspace @gotrippin/core can be undefined at runtime if dist/cache is stale).
 * Kept in sync with @gotrippin/core `tripDisplayTitle`.
 */
export function tripDisplayTitle(trip: {
  title?: string | null;
  destination?: string | null;
}): string | null {
  const rawTitle = typeof trip.title === "string" ? trip.title.trim() : "";
  if (rawTitle.length > 0) {
    return rawTitle;
  }
  const rawDest = typeof trip.destination === "string" ? trip.destination.trim() : "";
  return rawDest.length > 0 ? rawDest : null;
}
