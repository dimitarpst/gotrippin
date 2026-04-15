import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import AuthForm from "@/components/auth/AuthForm";
import { appConfig } from "@/config/appConfig";
import { sanitizeInternalNextPath } from "@/lib/internal-next-path";

const siteUrl = appConfig.siteUrl || "https://gotrippin.app";

/** Login surface: not a discovery page; avoid indexing and wrong inherited canonical from parent layouts. */
export const metadata: Metadata = {
  alternates: { canonical: `${siteUrl}/auth` },
  robots: { index: false, follow: true },
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sp = await searchParams;
  const nextAfterLogin = sanitizeInternalNextPath(sp.next);

  if (user) {
    redirect(nextAfterLogin ?? "/trips");
  }

  return <AuthForm redirectAfterLogin={nextAfterLogin ?? undefined} />;
}
