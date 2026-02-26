import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import UserPageClient from "./UserPageClient";

export default async function UserPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_color, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <UserPageClient
      initialUser={{
        id: user.id,
        email: user.email ?? "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        identities: user.identities ?? [],
        user_metadata: user.user_metadata ?? {},
        display_name: profile?.display_name ?? null,
        avatar_color: profile?.avatar_color ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
    />
  );
}
