/**
 * Shared palette for route leg colors and trip accent.
 * Each leg of a multi-stop route cycles through this palette.
 */
export const ROUTE_COLOR_PALETTE: string[] = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f97316", // orange
  "#ff6b6b", // coral
];

/** Returns the palette color for a given leg index (cycles). */
export function getLegColor(legIndex: number): string {
  return ROUTE_COLOR_PALETTE[legIndex % ROUTE_COLOR_PALETTE.length];
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function isSolidRouteColor(value: string | null | undefined): value is string {
  return typeof value === "string" && HEX_REGEX.test(value);
}

/** Returns a random color from the palette (for new trips when user doesn't pick one). */
export function getRandomRouteColor(): string {
  return ROUTE_COLOR_PALETTE[Math.floor(Math.random() * ROUTE_COLOR_PALETTE.length)];
}
