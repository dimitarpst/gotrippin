import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import AuthForm from "@/components/auth/AuthForm";

export default async function AuthPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/trips");
  }

  return <AuthForm />;
}
