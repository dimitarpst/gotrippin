// /src/lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";

// Browser client using cookies so middleware can read the session.
// Handles login, logout, and session refresh automatically.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
