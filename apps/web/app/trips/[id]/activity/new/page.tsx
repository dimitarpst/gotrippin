import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripByShareCode } from "@/lib/api/trips";
import NewActivityPageClient from "./NewActivityPageClient";

export const dynamic = "force-dynamic";

export default async function NewActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id: shareCode } = await params;
  const resolvedSearchParams = await searchParams;
  const type = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : 'custom';

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

  return <NewActivityPageClient trip={trip} shareCode={shareCode} initialType={type} />;
}
