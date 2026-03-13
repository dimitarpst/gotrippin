import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import AiSessionsListClient from "./AiSessionsListClient";

export default async function AiListPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/home");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_tokens_used_month, ai_token_monthly_limit")
    .eq("id", user.id)
    .single();

  const aiUsage = {
    used: profile?.ai_tokens_used_month ?? 0,
    limit: profile?.ai_token_monthly_limit ?? null,
    percent:
      profile?.ai_token_monthly_limit && profile.ai_token_monthly_limit > 0
        ? Math.min(
            100,
            Math.round(
              ((profile.ai_tokens_used_month ?? 0) /
                profile.ai_token_monthly_limit) *
                100,
            ),
          )
        : null,
  };

  return <AiSessionsListClient aiUsage={aiUsage} />;
}
