"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { AuthHeader } from "./AuthHeader";
import { AuthTabs } from "./AuthTabs";
import { AuthFields } from "./AuthFields";
import { AuthDivider } from "./AuthDivider";

export default function AuthForm() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(isLogin ? "Login" : "Register", { email, password, name });
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
          <AuthTabs isLogin={isLogin} setIsLogin={setIsLogin} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthFields
              isLogin={isLogin}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
            />

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  {t("auth.forgot_password")}
                </button>
              </div>
            )}

            <Button
              type="submit"
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
            <Button
              type="button"
              variant="outline"
              className="w-full bg-black/30 border-white/10 text-white hover:bg-black/50 hover:border-white/20 py-6 rounded-xl transition-all duration-200"
            >
              <Chrome className="mr-2 w-5 h-5" />
              {t("auth.continue_with_google")}
            </Button>
          </div>

          <p className="text-center text-sm text-[var(--muted)] mt-6">
            {isLogin ? t("auth.no_account") : t("auth.have_account")}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors ms-1"
            >
              {isLogin ? t("auth.sign_up") : t("auth.sign_in")}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
