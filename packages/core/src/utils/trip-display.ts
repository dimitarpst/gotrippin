/**
 * Primary label for a trip: prefer the user-editable title, then destination.
 * Use everywhere we show a trip name (headers, cards, map chrome) so the chosen title wins.
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
