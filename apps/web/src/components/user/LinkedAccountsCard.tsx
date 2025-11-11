"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Link as LinkIcon, Unlink, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkGoogle = async () => {
    // Only allow linking if user has a password (for security)
    if (!hasEmailPassword) {
      setError(t("profile.link_account_password_required"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/user?linked=true`
        : `${process.env.NEXT_PUBLIC_SITE_URL || ""}/user?linked=true`;


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
    // Don't allow unlinking if it's the only auth method
    if (!hasEmailPassword) {
      setError(t("profile.unlink_account_last_provider"));
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
      
      // Force a complete page reload after a brief moment to show success
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Failed to unlink Google account:", err);
      setError(err instanceof Error ? err.message : "Failed to unlink account");
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
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{t("profile.email_password_account")}</p>
                <p className="text-xs text-white/60">
                  {hasEmailPassword ? t("profile.connected") : t("profile.not_connected")}
                </p>
              </div>
            </div>
            {hasEmailPassword && (
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">{t("profile.active")}</span>
              </div>
            )}
          </div>

          {/* Google Provider */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 bg-white/5 rounded-xl border border-white/8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
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
                    disabled={loading || !hasEmailPassword}
                    variant="outline"
                    size="sm"
                    className="bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400 cursor-pointer"
                    title={!hasEmailPassword ? t("profile.unlink_account_last_provider") : ""}
                  >
                    <Unlink className="w-3 h-3 mr-1" />
                    {t("profile.unlink")}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLinkGoogle}
                  disabled={loading || !hasEmailPassword}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer"
                  title={!hasEmailPassword ? t("profile.link_account_password_required") : ""}
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

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

