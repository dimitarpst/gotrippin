import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

/**
 * Server component: redirect already-logged-in users to home.
 * Reset link session (hash / recovery) is only available in the browser, so the
 * form and updateUser() stay in ResetPasswordPageClient.
 */
export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return <ResetPasswordPageClient />;
}
