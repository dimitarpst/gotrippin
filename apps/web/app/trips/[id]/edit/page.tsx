import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server"
import { fetchTripByShareCode } from "@/lib/api/trips"
import EditTripPageClient from "./EditTripPageClient"

export const dynamic = "force-dynamic"

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: shareCode } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const token = await getServerAuthToken()
  if (!token) {
    redirect("/auth")
  }

  let trip: Awaited<ReturnType<typeof fetchTripByShareCode>> | null = null
  try {
    trip = await fetchTripByShareCode(shareCode, token)
  } catch {
    notFound()
  }

  if (!trip) {
    notFound()
  }

  return <EditTripPageClient trip={trip} shareCode={shareCode} />
}
