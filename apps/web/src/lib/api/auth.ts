export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

