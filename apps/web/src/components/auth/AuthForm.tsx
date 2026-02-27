"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { AuthHeader } from "./AuthHeader";
import { AuthTabs } from "./AuthTabs";
import { AuthFields } from "./AuthFields";
import { AuthDivider } from "./AuthDivider";
import { EmailConfirm } from "./EmailConfirm";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

  export default function AuthForm() {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");

    // 🧩 Auth hook + router
    const { signIn, signUp, signInWithGoogle, loading } = useAuth();
    const [pendingConfirmation, setPendingConfirmation] = useState(false);
    const [lastEmail, setLastEmail] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    // 🧩 Updated only this handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError(t("auth.passwords_do_not_match"));
      return;
    }

    try {
      if (isLogin) {
        await signIn(email, password);
        router.push("/");
      } else {
        await signUp(email, password, name);
        setPendingConfirmation(true);
        setLastEmail(email);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("email not confirmed")) {
        setPendingConfirmation(true);
        setLastEmail(email);
      } else if (msg.toLowerCase().includes("invalid login credentials")) {
        const { data: exists, error: rpcError } = await supabase.rpc("auth_user_exists", {
          check_email: email.trim(),
        });
        if (rpcError) {
          setError(msg);
          setIsLogin(false);
          return;
        }
        if (exists === true) {
          setError(t("auth.invalid_credentials"));
        } else {
          setError(t("auth.no_account_switch"));
          setIsLogin(false);
        }
      } else {
        setError(msg);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setGoogleLoading(true);
      await signInWithGoogle();
      // OAuth redirect will happen automatically
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setGoogleLoading(false);
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
          <AuthHeader isLogin={isLogin} />
          <AuthTabs isLogin={isLogin} setIsLogin={(v) => { setIsLogin(v); setError(null); }} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <EmailConfirm visible={pendingConfirmation} lastEmail={lastEmail} />

            <AuthFields
              isLogin={isLogin}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
            />

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

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer"
                >
                  {t("auth.forgot_password")}
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium py-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--accent)]/20 group"
            >
              <span>
                {isLogin ? t("auth.sign_in") : t("auth.create_account")}
              </span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </form>

          <AuthDivider />

          <div className="space-y-3">
            <GoogleSignInButton 
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? t("auth.no_account") : t("auth.have_account")}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors ms-1 cursor-pointer"
            >
              {isLogin ? t("auth.sign_up") : t("auth.sign_in")}
            </button>
          </p>
        </div>
      </motion.div>

      <ForgotPasswordDialog
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </div>
  );
}
