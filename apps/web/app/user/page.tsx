"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import UserProfile from "@/components/user/UserProfile";
import PageLoader from "@/components/ui/page-loader";
import PageError from "@/components/ui/page-error";
import { toast } from "sonner";

export default function UserPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store last saved values to show immediately (optimistic update)
  const [lastSaved, setLastSaved] = useState<{ displayName?: string; avatarColor?: string; avatarUrl?: string }>({});

  // Check if we returned from account linking (moved from useMemo - side effects belong in useEffect)
  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (params.get("linked") === "true" || hashParams.get("linked") === "true") {
      const timeoutId = setTimeout(() => {
        window.history.replaceState({}, "", "/user");
        window.location.reload();
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  const profileData = useMemo(() => {
    if (!user) return null;
    return {
      uid: user.id,
      email: user.email ?? "",
      // Show last saved value if available, otherwise from user metadata
      displayName:
        lastSaved.displayName ||
        user.display_name ||
        (user.user_metadata?.display_name as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        "",
      createdAt: user.created_at ? new Date(user.created_at) : null,
      lastSignInAt: (user.last_sign_in_at ? new Date(user.last_sign_in_at) : null) as Date | null,
      // Show last saved color if available, otherwise from profile
      avatarColor: lastSaved.avatarColor || user.avatar_color || null,
      // Show last saved avatar URL, or from profile, or Google. Trust DB value so saved avatars display.
      avatarUrl: lastSaved.avatarUrl || user.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || null,
    };
  }, [user, lastSaved]);

  const handleSave = async (updates: { displayName: string; avatarColor: string; avatarUrl?: string }) => {
    if (!user) {
      setSaving(false);
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const colorToSave =
        updates.avatarColor?.startsWith("#") && updates.avatarColor.length === 7
          ? updates.avatarColor
          : "#ff6b6b";

      // Single profiles update — no updateUser (it blocks/hangs and competes with DB writes)
      const updatePromise = supabase
        .from("profiles")
        .update({
          display_name: updates.displayName.trim(),
          avatar_color: colorToSave,
          ...(updates.avatarUrl && { avatar_url: updates.avatarUrl }),
        })
        .eq("id", user.id);

      let timeoutId: ReturnType<typeof setTimeout>;
      const result = await Promise.race([
        updatePromise,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Save timed out. Please try again.")), 12000);
        }),
      ]).catch((err: unknown) => {
        throw err instanceof Error ? err : new Error(String(err));
      }).finally(() => {
        clearTimeout(timeoutId!);
      });

      const { error: profErr } = result as Awaited<typeof updatePromise>;
      if (profErr) throw profErr;

      // Optimistically update local state to show changes immediately
      setLastSaved({
        displayName: updates.displayName.trim(),
        avatarColor: colorToSave,
        avatarUrl: updates.avatarUrl,
      });

      // Do NOT run refreshProfile after save — it contends with the next save's profiles update and causes hangs (refreshSession can block)
      setSaving(false);
      toast.success(t("profile.save_success", { defaultValue: "Profile updated successfully!" }));
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(t("profile.save_failed", { defaultValue: "Failed to update profile" }), {
        description: msg
      });
      setSaving(false);
      return false;
    }
  };



  // Match trips page: render nothing until auth ready (avoids mount race)
  if (loading) {
    return <PageLoader />;
  }

  // Show login prompt if not logged in (e.g. signed out, or profile deleted)
  if (!user) {
    return (
      <PageError
        title={t("profile.please_sign_in")}
        message={t("profile.sign_in_required")}
        onRetry={() => router.push("/auth")}
        showAurora={true}
      />
    );
  }

  if (!profileData) {
    return <PageLoader message={t("profile.loading_profile")} />;
  }

  // Detect authentication providers
  const hasEmailPassword = user?.identities?.some(identity => identity.provider === 'email') ?? false;
  const hasGoogle = user?.identities?.some(identity => identity.provider === 'google') ?? false;
  const googleAvatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || null;
  const googleEmail = hasGoogle ? (user?.user_metadata?.email as string | undefined) || null : null;

  return (
    <UserProfile
      data={profileData}
      user={user}
      onBack={() => router.push("/")}
      onSave={handleSave}
      saving={saving}
      error={error}
      clearError={() => setError(null)}
    />
  );
}
