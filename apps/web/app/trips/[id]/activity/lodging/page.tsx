import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripByShareCode } from "@/lib/api/trips";
import LodgingPageClient from "./LodgingPageClient";

export const dynamic = "force-dynamic";

export default async function LodgingPage({
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
    redirect("/auth");
  }

  const token = await getServerAuthToken();
  if (!token) {
    redirect("/auth");
  }

  let trip;
  try {
    trip = await fetchTripByShareCode(shareCode, token);
  } catch {
    notFound();
  }

  if (!trip) {
    notFound();
  }

  return <LodgingPageClient trip={trip} shareCode={shareCode} />;
}
