"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link as LinkIcon, Unlink, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { appConfig } from "@/config/appConfig";
import { useAuth } from "@/contexts/AuthContext";

interface LinkedAccountsCardProps {
  hasEmailPassword: boolean;
  hasGoogle: boolean;
  googleEmail?: string | null;
}

export default function LinkedAccountsCard({ 
  hasEmailPassword, 
  hasGoogle,
  googleEmail 
}: LinkedAccountsCardProps) {
  const { t } = useTranslation();
  const { refreshProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  // Track if password was just set (optimistic state until Supabase adds email identity)
  const [passwordJustSet, setPasswordJustSet] = useState(false);
  // Source of truth from DB: user has a password set (from RPC get_my_has_password)
  const [hasPasswordFromDb, setHasPasswordFromDb] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Persist sign-up provider once (so we know "created with Google" vs "created with email")
  const signupProvider = user?.user_metadata?.signup_provider as "email" | "google" | undefined;

  const refreshProfileRef = useRef(refreshProfile);
  refreshProfileRef.current = refreshProfile;

  // Run heavy auth work when browser is idle — avoids blocking React commit/handler attachment
  const runWhenIdle = (cb: () => void) => {
    if (typeof requestIdleCallback !== "undefined") {
      return requestIdleCallback(cb, { timeout: 3000 });
    }
    return window.setTimeout(cb, 0) as unknown as number;
  };
  const cancelIdle = (id: number) => {
    if (typeof cancelIdleCallback !== "undefined") {
      cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  };

  useEffect(() => {
    if (!user?.id || signupProvider != null || (!hasEmailPassword && !hasGoogle)) return;
    const id = runWhenIdle(() => {
      const value = hasEmailPassword ? "email" : "google";
      supabase.auth.updateUser({ data: { signup_provider: value } }).then(() => {
        refreshProfileRef.current?.().catch(() => {});
      }).catch(() => {});
    });
    return () => cancelIdle(id);
  }, [user?.id, signupProvider, hasEmailPassword, hasGoogle]);

  // Ask Supabase (DB) if current user has a password set. Run when idle.
  useEffect(() => {
    if (!user?.id) return;
    if (hasEmailPassword) {
      setHasPasswordFromDb(true);
      return;
    }
    let cancelled = false;
    const id = runWhenIdle(async () => {
      try {
        const { data, error } = await supabase.rpc("get_my_has_password");
        if (cancelled) return;
        if (error) {
          setHasPasswordFromDb(false);
          return;
        }
        if (data === true) {
          await supabase.rpc("ensure_email_identity");
          if (!cancelled) refreshProfileRef.current?.().catch(() => {});
        }
        if (!cancelled) setHasPasswordFromDb(data === true);
      } catch {
        if (!cancelled) setHasPasswordFromDb(false);
      }
    });
    return () => {
      cancelled = true;
      cancelIdle(id);
    };
  }, [user?.id, hasEmailPassword]);

  useEffect(() => {
    if (hasEmailPassword && passwordJustSet) setPasswordJustSet(false);
  }, [hasEmailPassword, passwordJustSet]);

  // Connected if: email identity exists, or DB says password set, or we just set it this session
  const isEmailPasswordConnected = hasEmailPassword || hasPasswordFromDb === true || passwordJustSet;

  // Unlink Google: only allowed when account was created with email (so they can safely remove Google)
  // Created with Google → never allow unlink (big-corp style)
  const canUnlinkGoogle = hasGoogle && signupProvider === 'email';

  // Message when Unlink is disabled (for tooltip and inline error)
  const unlinkGoogleDisabledMessage = !hasGoogle
    ? ''
    : signupProvider === 'google'
      ? t('profile.unlink_google_created_with_google')
      : !isEmailPasswordConnected
        ? t('profile.unlink_account_last_provider')
        : t('profile.unlink_google_requires_email_signin');

  const handleLinkGoogle = async () => {
    // Only allow linking if user has a password (for security)
    if (!isEmailPasswordConnected) {
      setError(t("profile.link_account_password_required"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : appConfig.siteUrl;
      const redirectUrl = `${base}/user?linked=true`;


      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // FORCE Google to show account picker
          },
        },
      });

      if (linkError) {
        console.error("Link error:", linkError);
        throw linkError;
      }

      // Redirect will happen automatically - OAuth flow takes over
    } catch (err) {
      console.error("Failed to link Google account:", err);
      setError(err instanceof Error ? err.message : "Failed to link account");
      setLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!canUnlinkGoogle) {
      setError(unlinkGoogleDisabledMessage || t("profile.unlink_account_last_provider"));
      return;
    }

    // Confirm with user
    if (!confirm(t("profile.unlink_account_confirm"))) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const googleIdentity = user?.identities?.find(id => id.provider === 'google');

      if (!googleIdentity) {
        throw new Error("Google identity not found");
      }

      const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity);

      if (unlinkError) throw unlinkError;

      setSuccess(true);
      // Refresh session and profile so UI updates immediately (no reload needed)
      await refreshProfile();
    } catch (err) {
      console.error("Failed to unlink Google account:", err);
      setError(err instanceof Error ? err.message : "Failed to unlink account");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setError(null);

    if (newPassword.length < 6) {
      setError(t("auth.password_too_short", { defaultValue: "Password must be at least 6 characters long." }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwords_do_not_match", { defaultValue: "Passwords do not match." }));
      return;
    }

    setLoading(true);

    try {
      // Supabase's updateUser can hang in dev (especially with PKCE + Strict Mode),
      // even though the backend applies the change and emits USER_UPDATED.
      // Use a bounded wait so the UI never stays disabled forever.
      const updatePromise = supabase.auth.updateUser({
        password: newPassword,
      });

      const timeoutMs = 8000;
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs)
      );

      const result = (await Promise.race([
        updatePromise,
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof supabase.auth.updateUser>> | null;

      const updateError = result?.error ?? null;
      const updatedUser = result?.data?.user ?? null;
      const updatedIdentities = updatedUser?.identities ?? [];
      const hasEmailIdentityAfterUpdate = updatedIdentities.some(id => id.provider === 'email');

      if (updateError) {
        // CRITICAL FIX: "New password should be different" means password EXISTS
        // Supabase stores passwords separately from identities, so even if email identity
        // doesn't exist, if we get this error, we know a password is set
        if (updateError.message.includes("New password should be different from the old password")) {
          setPasswordJustSet(true);
          void (async () => {
            try {
              await supabase.rpc("ensure_email_identity");
              refreshProfileRef.current?.().catch(() => {});
            } catch {
              /* ignore */
            }
          })();
          setPasswordSuccess(t("profile.password_already_set", {
            defaultValue: "Password is already set for this account."
          }));
          setShowAddPassword(false);
          setNewPassword("");
          setConfirmPassword("");
          setLoading(false);
          return; // Don't throw - this is actually success (password exists)
        }
        
        throw updateError;
      }

      setPasswordJustSet(true);
      setPasswordSuccess(t("profile.password_update_success"));
      setShowAddPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);

      // Keep all auth sync work in the background so UI never blocks on slow/hanging auth RPCs.
      void (async () => {
        let ensureErr: { message?: string } | null = null;
        try {
          const res = await supabase.rpc("ensure_email_identity");
          ensureErr = res.error ?? null;
        } catch (err) {
          ensureErr = err as { message?: string };
        }
        if (ensureErr) {
          console.warn("ensure_email_identity failed (password was still set):", ensureErr);
        }

        await supabase.auth.refreshSession().catch(() => {});
        const { data: { session: sessionAfterRefresh } } = await supabase.auth.getSession();
        const identitiesAfterRefresh = sessionAfterRefresh?.user?.identities?.map((i: { provider: string }) => i.provider) ?? [];
        const hasEmailIdentity = identitiesAfterRefresh.includes("email");

        if (!hasEmailIdentity && user?.email) {
          await supabase.auth.signInWithPassword({ email: user.email, password: newPassword });
        }

        refreshProfileRef.current?.().catch(() => {});
      })();
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      console.error("Failed to add password:", err);

      // Map common Supabase error messages to clearer UI copy
      let uiMessage: string;
      if (rawMessage.includes("New password should be different from the old password")) {
        uiMessage = t("profile.password_same_as_old", {
          defaultValue: "New password must be different from your current password.",
        });
      } else if (rawMessage.includes("Auth session missing")) {
        uiMessage = t("profile.session_missing", {
          defaultValue: "Your session expired. Please sign in again and then set a new password.",
        });
      } else {
        uiMessage = t("profile.password_update_error", {
          defaultValue: "Failed to update password.",
        });
      }

      setError(uiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden border border-white/8"
      style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 800, damping: 25, delay: 0.2 }}
    >
      <div className="px-4 sm:px-6 py-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">{t("profile.linked_accounts")}</h3>
          <p className="text-sm text-white/60">{t("profile.linked_accounts_description")}</p>
        </div>

        <div className="space-y-3">
          {/* Email/Password Provider */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 bg-white/5 rounded-xl border border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{t("profile.email_password_account")}</p>
                <p className="text-xs text-white/60">
                  {isEmailPasswordConnected ? t("profile.connected") : t("profile.not_connected")}
                </p>
              </div>
            </div>
            {isEmailPasswordConnected ? (
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">{t("profile.active")}</span>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setShowAddPassword((prev) => !prev);
                  setPasswordSuccess(null);
                  setError(null);
                }}
                disabled={loading}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer"
              >
                {t("profile.add_password")}
              </Button>
            )}
          </div>

          {/* Add Password Inline Form */}
          {!isEmailPasswordConnected && showAddPassword && (
            <form
              onSubmit={handleAddPassword}
              className="space-y-3 p-3 bg-black/40 rounded-xl border border-white/10"
            >
              <p className="text-xs text-white/70">
                {t("profile.password_description")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="password"
                  className="px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-(--accent)"
                  placeholder={t("auth.new_password")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="password"
                  className="px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-(--accent)"
                  placeholder={t("auth.confirm_new_password")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  size="sm"
                  className="bg-(--accent) hover:bg-(--accent-hover) text-white cursor-pointer"
                >
                  {t("profile.set_password")}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPassword(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setPasswordSuccess(null);
                  }}
                  className="text-xs text-white/60 hover:text-white cursor-pointer"
                >
                  {t("profile.cancel")}
                </button>
              </div>
            </form>
          )}

          {/* Google Provider */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 bg-white/5 rounded-xl border border-white/8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">Google</p>
                <p className="text-xs text-white/60 truncate">
                  {hasGoogle ? (googleEmail || t("profile.connected")) : t("profile.not_connected")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {hasGoogle ? (
                <>
                  <div className="flex items-center gap-2 text-green-400 mr-2">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">{t("profile.active")}</span>
                  </div>
                  <Button
                    onClick={handleUnlinkGoogle}
                    disabled={loading || !canUnlinkGoogle}
                    variant="outline"
                    size="sm"
                    className="bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400 cursor-pointer"
                    title={!canUnlinkGoogle ? unlinkGoogleDisabledMessage : ""}
                  >
                    <Unlink className="w-3 h-3 mr-1" />
                    {t("profile.unlink")}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLinkGoogle}
                  disabled={loading || !isEmailPasswordConnected}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer"
                  title={!isEmailPasswordConnected ? t("profile.link_account_password_required") : ""}
                >
                  <LinkIcon className="w-3 h-3 mr-1" />
                  {t("profile.link")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mt-4"
          >
            <Check className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-400">{t("profile.account_unlinked")}</p>
          </motion.div>
        )}

        {passwordSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mt-4"
          >
            <Check className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-400">{passwordSuccess}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4"
          >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

