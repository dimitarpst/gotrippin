import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import CreateTripPageClient from "./CreateTripPageClient"

export const dynamic = "force-dynamic"

export default async function CreateTripPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return <CreateTripPageClient />
}
