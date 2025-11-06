// /src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// This client runs in the browser only.
// It handles login, logout, and session refresh automatically.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!, // or ANON_KEY if not migrated yet
  {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Auto-detect and process auth codes in URL
    },
  }
);
