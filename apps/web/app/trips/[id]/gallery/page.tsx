import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripByShareCode, fetchTripGallery } from "@/lib/api/trips";
import GalleryPageClient from "./GalleryPageClient";

export const dynamic = "force-dynamic";

export default async function TripGalleryPage({
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

  const gallery = await fetchTripGallery(trip.id, token);

  return (
    <GalleryPageClient
      trip={trip}
      shareCode={shareCode}
      initialGallery={gallery}
    />
  );
}
