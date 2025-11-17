// /src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// This client runs in the browser only.
// It handles login, logout, and session refresh automatically.
// 
// Note: With autoRefreshToken: true, Supabase will automatically attempt to refresh
// expired tokens. If the refresh token is invalid/expired, errors may be thrown.
// These are handled gracefully in AuthContext.tsx - the session is cleared and
// the user is signed out silently.
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
