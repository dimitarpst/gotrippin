import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripByShareCode } from "@/lib/api/trips";
import { resolveTripCoverUrl } from "@/lib/r2";
import NotesPageClient from "./NotesPageClient";

export const dynamic = "force-dynamic";

export default async function TripNotesPage({
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

  let trip;
  try {
    trip = await fetchTripByShareCode(shareCode, token);
  } catch {
    notFound();
  }

  return (
    <NotesPageClient trip={trip} shareCode={shareCode} coverImageUrl={resolveTripCoverUrl(trip)} />
  );
}
