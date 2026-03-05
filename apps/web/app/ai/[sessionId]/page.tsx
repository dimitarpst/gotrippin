import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import AiTestClient from "../AiTestClient";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AiChatPage({ params }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/home");
  }

  const { sessionId } = await params;
  return <AiTestClient sessionId={sessionId} />;
}
