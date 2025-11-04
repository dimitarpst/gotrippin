// /src/lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";

// This client runs in the browser only.
// It handles login, logout, and session refresh automatically.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY! // or ANON_KEY if not migrated yet
);
