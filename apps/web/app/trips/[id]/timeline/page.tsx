import { redirect } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Full-trip itinerary now opens as a Vaul drawer on the trip overview.
 * Keep this route as a redirect for bookmarks and shared links.
 */
export default async function TimelinePage({
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
    redirect("/home");
  }

  const token = await getServerAuthToken();
  if (!token) {
    redirect("/home");
  }

  redirect(`/trips/${shareCode}?itinerary=1`);
}
