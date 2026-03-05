import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ExploreUnderDevelopment from "./ExploreUnderDevelopment";

export default async function ExplorePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/home");
  }

  return <ExploreUnderDevelopment />;
}
