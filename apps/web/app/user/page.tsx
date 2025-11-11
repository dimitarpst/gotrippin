"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import UserProfile from "@/components/user/UserProfile";

export default function UserPage() {
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store last saved values to show immediately (optimistic update)
  const [lastSaved, setLastSaved] = useState<{ displayName?: string; avatarColor?: string; avatarUrl?: string }>({});

  // Check if we returned from account linking
  useMemo(() => {
    if (typeof window !== "undefined") {
      const fullUrl = window.location.href;
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      
      if (params.get('linked') === 'true' || hashParams.get('linked') === 'true') {
        
        // Don't immediately reload - let's see what state we're in first
        setTimeout(() => {
          window.history.replaceState({}, '', '/user');
          window.location.reload();
        }, 3000);
      }
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
        (user.user_metadata?.display_name as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        "",
      createdAt: user.created_at ? new Date(user.created_at) : null,
      lastSignInAt: (user.last_sign_in_at ? new Date(user.last_sign_in_at) : null) as Date | null,
      // Show last saved color if available, otherwise from profile
      avatarColor: lastSaved.avatarColor || user.avatar_color || null,
      // Show last saved avatar URL or from user metadata (Google OAuth)
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

      // Update avatar color and URL in profiles table
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ 
          avatar_color: colorToSave,
          ...(updates.avatarUrl && { avatar_url: updates.avatarUrl }),
        })
        .eq("id", user.id);

      if (profErr) throw profErr;

      // Update display name in user metadata (fire and forget - it hangs but saves data)
      supabase.auth.updateUser({
        data: { display_name: updates.displayName.trim() },
      }).catch((err) => console.error("Auth update error (ignored):", err));

      // Optimistically update local state to show changes immediately
      setLastSaved({
        displayName: updates.displayName.trim(),
        avatarColor: colorToSave,
        avatarUrl: updates.avatarUrl,
      });
      
      // Refresh profile to get updated data from database (with timeout)
      try {
        await Promise.race([
          refreshProfile(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Refresh timeout")), 3000))
        ]);
      } catch (refreshError) {
        console.warn("Profile refresh failed or timed out:", refreshError);
        // Continue anyway - we have optimistic updates
      }
      
      // Small delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSaving(false);
      return true;
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
      setSaving(false);
      return false;
    }
  };



  if (loading) {
    return (
      <div className="pt-20 text-center text-white/60">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center px-4 max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-[var(--color-foreground)]">
            {t("profile.please_sign_in")}
          </h1>
          <p className="text-white/60 mb-8">
            {t("profile.sign_in_required")}
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="px-6 py-3 bg-[var(--color-accent)] text-[var(--color-accent-foreground)] rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {t("profile.go_to_sign_in")}
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="pt-20 text-center text-white/60">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
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
