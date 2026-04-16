export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function displayNameFromProfiles(profiles: unknown): string {
  if (profiles === null || profiles === undefined) {
    return "";
  }
  if (Array.isArray(profiles)) {
    const first = profiles[0];
    if (isRecord(first) && typeof first.display_name === "string" && first.display_name.trim().length > 0) {
      return first.display_name.trim();
    }
    return "";
  }
  if (isRecord(profiles) && typeof profiles.display_name === "string" && profiles.display_name.trim().length > 0) {
    return profiles.display_name.trim();
  }
  return "";
}

export function avatarUrlFromProfiles(profiles: unknown): string | null {
  if (profiles === null || profiles === undefined) {
    return null;
  }
  if (Array.isArray(profiles)) {
    const first = profiles[0];
    if (isRecord(first) && typeof first.avatar_url === "string" && first.avatar_url.trim().length > 0) {
      return first.avatar_url.trim();
    }
    return null;
  }
  if (isRecord(profiles) && typeof profiles.avatar_url === "string" && profiles.avatar_url.trim().length > 0) {
    return profiles.avatar_url.trim();
  }
  return null;
}
