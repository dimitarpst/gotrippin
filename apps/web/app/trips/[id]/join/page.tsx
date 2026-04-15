import { redirect } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { sanitizeInternalNextPath } from "@/lib/internal-next-path";
import JoinTripClient from "./JoinTripClient";

export const dynamic = "force-dynamic";

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shareCode } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = sanitizeInternalNextPath(`/trips/${shareCode}/join`);
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/auth${q}`);
  }

  const token = await getServerAuthToken();
  if (!token) {
    const nextPath = sanitizeInternalNextPath(`/trips/${shareCode}/join`);
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/auth${q}`);
  }

  return <JoinTripClient shareCode={shareCode} />;
}
