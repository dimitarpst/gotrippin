"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

interface ChangePasswordCardProps {
  hasPassword: boolean; // Whether user already has a password (email/password signup) or not (OAuth only)
}

export default function ChangePasswordCard({ hasPassword }: ChangePasswordCardProps) {
  const { t } = useTranslation();
  const { refreshProfile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);


    // Validation
    if (newPassword.length < 6) {
      setError(t("auth.password_too_short"));
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwords_do_not_match"));
      setLoading(false);
      return;
    }

    try {
      // When changing (not adding) password, verify old password first
      if (hasPassword && user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: oldPassword,
        });
        if (signInError) {
          setError(t("profile.incorrect_current_password", "Current password is incorrect."));
          setLoading(false);
          return;
        }
      }

      const result = await supabase.auth.updateUser({
        password: newPassword,
      });


      if (result.error) {
        console.error("[ChangePasswordCard] Supabase password update error:", result.error);
        throw result.error;
      }

      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      await refreshProfile(); // Refresh user state to reflect password addition

      setTimeout(() => {
        setSuccess(false);
        setIsEditing(false);
      }, 5000); // Give more time to read the message
    } catch (err) {
      console.error("[ChangePasswordCard] Caught an error during password update:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
  };

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden border border-white/8"
      style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 800, damping: 25, delay: 0.15 }}
    >
      <div className="px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white">
                {hasPassword ? t("profile.change_password") : t("profile.add_password")}
              </h3>
              <p className="text-sm text-white/60">
                {hasPassword ? "Update your account password" : t("profile.password_description")}
              </p>
            </div>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer self-start sm:self-auto"
            >
              {t("profile.edit")}
            </Button>
          )}
        </div>

         <AnimatePresence>
          {isEditing && (
            <motion.form
              key="change-password-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="space-y-4 overflow-hidden"
            >
            {hasPassword && (
              <div className="space-y-2">
                <label className="text-sm text-white/70">{t("profile.current_password")}</label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required={hasPassword}
                  disabled={loading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-white/70">{t("auth.new_password")}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">{t("auth.confirm_new_password")}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            {hasPassword && (
              <p className="text-xs text-white/50">
                {t("profile.password_change_note")}
              </p>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
              >
                <Check className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-400">{t("profile.password_update_success")}</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || (hasPassword && !oldPassword)}
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white cursor-pointer"
              >
                {loading
                  ? t("profile.saving")
                  : hasPassword
                  ? t("profile.update_password")
                  : t("profile.set_password")}
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer"
              >
                {t("profile.cancel")}
              </Button>
            </div>
          </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

