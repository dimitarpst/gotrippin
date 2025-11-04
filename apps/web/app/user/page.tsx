"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import UserProfile from "@/components/user/UserProfile";

type ProfileRow = { id: string; avatar_color: string | null };

export default function UserPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  const [avatarColor, setAvatarColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // load avatar_color from profiles
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, avatar_color")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();
      if (!error && data) setAvatarColor(data.avatar_color);
    })();
  }, [user]);

  const profileData = useMemo(() => {
    if (!user) return null;
    return {
      uid: user.id,
      email: user.email ?? "",
      phone: user.phone ?? "",
      displayName:
        (user.user_metadata?.display_name as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        "",
      createdAt: user.created_at ? new Date(user.created_at) : null,
      lastSignInAt: (user.last_sign_in_at ? new Date(user.last_sign_in_at) : null) as Date | null,
      avatarColor: avatarColor ?? null,
    };
  }, [user, avatarColor]);

const handleSave = async (updates: {
  displayName: string;
  phone: string;
  avatarColor: string | null;
}) => {
  if (!user) return;

  try {
    console.log("▶️ handleSave start", updates);
    setSaving(true);
    setError(null);

    // ✅ Do not await this; let Supabase refresh session in background
    supabase.auth.updateUser({
      data: { display_name: updates.displayName },
    }).catch((e) => console.warn("Auth update warning:", e));

    console.log("🟡 about to update profiles");
    const colorToSave =
      updates.avatarColor?.startsWith("#") && updates.avatarColor.length === 7
        ? updates.avatarColor
        : "#ff6b6b";

    const { data, error: profErr } = await supabase
      .from("profiles")
      .update({ avatar_color: colorToSave })
      .eq("id", user.id)
      .select();

    console.log("🟢 profile update result", { data, profErr });

    if (profErr) throw profErr;
    if (!data?.length) throw new Error("No matching profile row found.");

    setAvatarColor(colorToSave);
  } catch (e: any) {
    console.error("❌ Save error:", e);
    setError(e.message);
  } finally {
    console.log("🏁 handleSave finally");
    setSaving(false);
  }
};



  if (loading || !profileData) {
    return <div className="pt-20 text-center text-white/60">Loading…</div>;
  }

  return (
    <UserProfile
      data={profileData}
      onBack={() => router.push("/")}
      onSave={handleSave}
      saving={saving}
      error={error}
      clearError={() => setError(null)}
    />
  );
}
