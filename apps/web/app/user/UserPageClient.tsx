"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import UserProfile from "@/components/user/UserProfile";
import PageLoader from "@/components/ui/page-loader";
import { toast } from "sonner";

export interface InitialUserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  identities: Array<{ provider: string; [key: string]: unknown }>;
  user_metadata: Record<string, unknown>;
  display_name: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
}

interface UserPageClientProps {
  initialUser: InitialUserData;
}

export default function UserPageClient({ initialUser }: UserPageClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastSaved, setLastSaved] = useState<{ displayName?: string; avatarColor?: string; avatarUrl?: string }>({});

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

  // Use live user from AuthContext if available, fall back to server-fetched initial data
  const resolvedUser = user ?? initialUser;

  const profileData = useMemo(() => ({
    uid: resolvedUser.id,
    email: resolvedUser.email ?? "",
    displayName:
      lastSaved.displayName ||
      (resolvedUser as typeof initialUser).display_name ||
      (resolvedUser.user_metadata?.display_name as string | undefined) ||
      (resolvedUser.user_metadata?.full_name as string | undefined) ||
      "",
    createdAt: resolvedUser.created_at ? new Date(resolvedUser.created_at) : null,
    lastSignInAt: (resolvedUser.last_sign_in_at ? new Date(resolvedUser.last_sign_in_at) : null) as Date | null,
    avatarColor: lastSaved.avatarColor || (resolvedUser as typeof initialUser).avatar_color || null,
    avatarUrl: lastSaved.avatarUrl || (resolvedUser as typeof initialUser).avatar_url || (resolvedUser.user_metadata?.avatar_url as string | undefined) || null,
  }), [resolvedUser, lastSaved]);

  const handleSave = async (updates: { displayName: string; avatarColor: string; avatarUrl?: string }) => {
    if (!resolvedUser) {
      setSaving(false);
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const colorToSave =
        updates.avatarColor?.startsWith("#") && updates.avatarColor.length === 7
          ? updates.avatarColor
          : "#1a1a2e";

      const updatePromise = supabase
        .from("profiles")
        .update({
          display_name: updates.displayName.trim(),
          avatar_color: colorToSave,
          ...(updates.avatarUrl && { avatar_url: updates.avatarUrl }),
        })
        .eq("id", resolvedUser.id);

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

      setLastSaved({
        displayName: updates.displayName.trim(),
        avatarColor: colorToSave,
        avatarUrl: updates.avatarUrl,
      });

      setSaving(false);
      toast.success(t("profile.save_success", { defaultValue: "Profile updated successfully!" }));
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(t("profile.save_failed", { defaultValue: "Failed to update profile" }), {
        description: msg,
      });
      setSaving(false);
      return false;
    }
  };

  // useAuth is still loading but we already have server data — show a brief loader
  // only if live user is needed for identity-specific UI (identities array)
  if (user === undefined) {
    return <PageLoader />;
  }

  // Use live user for identity checks (providers list) if available, else initial data
  const identityUser = user ?? initialUser;
  const hasEmailPassword = identityUser.identities?.some((i) => i.provider === "email") ?? false;
  const hasGoogle = identityUser.identities?.some((i) => i.provider === "google") ?? false;

  return (
    <UserProfile
      data={profileData}
      user={identityUser as Parameters<typeof UserProfile>[0]["user"]}
      onBack={() => router.push("/")}
      onSave={handleSave}
      saving={saving}
      error={error}
      clearError={() => setError(null)}
    />
  );
}
