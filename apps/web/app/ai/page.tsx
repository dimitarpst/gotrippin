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

  return <AiSessionsListClient />;
}
