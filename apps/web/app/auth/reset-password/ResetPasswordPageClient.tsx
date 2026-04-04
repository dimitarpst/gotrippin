"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPageClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isActive) return;
        if (error) {
          console.error("Failed to get session for password reset:", error);
          return;
        }
        if (data.session) {
          setIsSessionReady(true);
        }
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("Unexpected error while getting session:", err);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      ) {
        setIsSessionReady(true);
      }
    });

    const timer = setTimeout(() => {
      setIsSessionReady((currentIsSessionReady) => {
        if (!currentIsSessionReady) {
          setError(t("auth.invalid_reset_link"));
        }
        return currentIsSessionReady;
      });
    }, 5000);

    return () => {
      isActive = false;
      subscription?.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("auth.password_min_length"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwords_do_not_match"));
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
      setError(err instanceof Error ? err.message : t("auth.failed_reset_password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div
          className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #ff7670 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #ff7670 0%, transparent 70%)",
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
              className="flex flex-col items-center justify-center pt-8 pb-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-white font-medium mb-2">
                {t("auth.password_reset_success")}
              </p>
              <p className="text-white/60 text-sm">
                {t("auth.logging_you_back_in")}
              </p>
            </motion.div>
          ) : (
            <>
              {!isSessionReady && !error && (
                <div className="text-center text-white/60 py-8">
                  <Spinner className="size-8 mx-auto text-[var(--color-accent)] mb-4" />
                  <p>Verifying reset link...</p>
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
                    <Lock className="absolute left-4 top-1/2 z-10 w-5 h-5 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.new_password")}
                      required
                      disabled={loading}
                      className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      toggleClassName="text-white/50 hover:bg-white/10 hover:text-white"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 z-10 w-5 h-5 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("auth.confirm_new_password")}
                      required
                      disabled={loading}
                      className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      toggleClassName="text-white/50 hover:bg-white/10 hover:text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium py-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--accent)]/20"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="size-4" />
                        {t("auth.resetting")}
                      </div>
                    ) : (
                      t("auth.reset_password_button")
                    )}
                  </Button>
                </motion.form>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
