"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // The Supabase client automatically handles the session recovery from the URL.
    // We listen for the auth event that signals this process is complete.
    // Due to a likely bug in this version of the library, a SIGNED_IN event
    // is fired for password recovery instead of PASSWORD_RECOVERY. We listen for both.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setIsSessionReady(true);
        // Unsubscribe immediately to prevent this listener from firing again
        // on subsequent auth events in the app's lifecycle.
        subscription?.unsubscribe();
      }
    });

    // Set a timeout to handle cases where no event is fired (e.g., invalid link)
    const timer = setTimeout(() => {
      // Use a function to get the latest state value
      setIsSessionReady((currentIsSessionReady) => {
        if (!currentIsSessionReady) {
          setError("Invalid or expired reset link. Please request a new one.");
        }
        return currentIsSessionReady;
      });
    }, 5000); // 5-second timeout

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div
          className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #ff6b6b 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #ff6b6b 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 25 }}
        className="w-full max-w-md"
      >
        <div className="bg-[var(--surface)]/80 backdrop-blur-xl rounded-2xl p-8 shadow-card border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("auth.reset_password_title")}
            </h1>
            <p className="text-white/60">
              {t("auth.enter_new_password")}
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-white font-medium mb-2">
                {t("auth.password_reset_success")}
              </p>
              <p className="text-white/60 text-sm">
                {t("auth.redirecting_to_login")}
              </p>
            </motion.div>
          ) : (
            <>
              {!isSessionReady && !error && (
                <div className="text-center text-white/60 py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-4">Verifying reset link...</p>
                </div>
              )}

              {isSessionReady && (
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.new_password")}
                      required
                      disabled={loading}
                      className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("auth.confirm_new_password")}
                      required
                      disabled={loading}
                      className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium py-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--accent)]/20"
                  >
                    {loading ? t("auth.resetting") : t("auth.reset_password_button")}
                  </Button>
                </motion.form>
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

