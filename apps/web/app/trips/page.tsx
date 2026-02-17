import { redirect } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTrips } from "@/lib/api/trips";
import { ApiError } from "@/lib/api/trips";
import TripsPageClient from "./TripsPageClient";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const token = await getServerAuthToken();
  let trips: Awaited<ReturnType<typeof fetchTrips>> = [];
  let error: string | null = null;

  if (token) {
    try {
      trips = await fetchTrips(token);
    } catch (err) {
      if (err instanceof ApiError) {
        error = err.message;
      } else {
        error = "Failed to fetch trips";
      }
    }
  } else {
    error = "Authentication required";
  }

  return <TripsPageClient trips={trips} error={error} />;
}
