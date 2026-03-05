import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import LandingPage from "@/components/landing/LandingPage"

export const dynamic = "force-dynamic"

export default async function HomeRoutePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/trips")
  }

  return <LandingPage />
}
