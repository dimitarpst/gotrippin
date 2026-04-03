import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import AuthForm from "@/components/auth/AuthForm";
import { appConfig } from "@/config/appConfig";

const siteUrl = appConfig.siteUrl || "https://gotrippin.app";

/** Login surface: not a discovery page; avoid indexing and wrong inherited canonical from parent layouts. */
export const metadata: Metadata = {
  alternates: { canonical: `${siteUrl}/auth` },
  robots: { index: false, follow: true },
};

export default async function AuthPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/trips");
  }

  return <AuthForm />;
}
