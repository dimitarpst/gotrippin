"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import UserProfile from "@/components/user/UserProfile";

export default function UserPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAvatarColor, setLocalAvatarColor] = useState<string | null>(null);

  // Don't redirect - show login button instead

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
      // Use local color if updated, otherwise use from auth hook
      avatarColor: localAvatarColor ?? user.avatar_color ?? null,
    };
  }, [user, localAvatarColor]);

const handleSave = async (updates: {
  displayName: string;
  phone: string;
  avatarColor: string | null;
}) => {
  if (!user) return;

  try {
    setSaving(true);
    setError(null);

    supabase.auth.updateUser({
      data: { display_name: updates.displayName },
    }).catch(() => {});

    const colorToSave =
      updates.avatarColor?.startsWith("#") && updates.avatarColor.length === 7
        ? updates.avatarColor
        : "#ff6b6b";

    const { data, error: profErr } = await supabase
      .from("profiles")
      .update({ avatar_color: colorToSave })
      .eq("id", user.id)
      .select();

    if (profErr) throw profErr;
    if (!data?.length) throw new Error("No matching profile row found.");

    setLocalAvatarColor(colorToSave);
  } catch (e: unknown) {
    if (e instanceof Error) {
      setError(e.message);
    } else {
      setError("An unknown error occurred");
    }
  } finally {
    setSaving(false);
  }
};



  if (loading) {
    return <div className="pt-20 text-center text-white/60">Loading…</div>;
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center px-4 max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-[var(--color-foreground)]">Please Sign In</h1>
          <p className="text-white/60 mb-8">
            You need to be signed in to view your profile.
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="px-6 py-3 bg-[var(--color-accent)] text-[var(--color-accent-foreground)] rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return <div className="pt-20 text-center text-white/60">Loading profile…</div>;
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
