"use client";

import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface AuthFieldsProps {
  isLogin: boolean;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (value: string) => void;
}

export function AuthFields({
  isLogin,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword = "",
  setConfirmPassword,
}: AuthFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* name field */}
      <motion.div
        animate={{
          opacity: isLogin ? 0 : 1,
          height: isLogin ? 0 : "auto",
        }}
        transition={{ type: "spring", stiffness: 600, damping: 25 }}
        className={isLogin ? "overflow-hidden pointer-events-none" : ""}
      >
        <Label htmlFor="name" className="text-white mb-2 block">
          {t("auth.name")}
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder={t("auth.name")}
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </motion.div>

      {/* email */}
      <div>
        <Label htmlFor="email" className="text-white mb-2 block">
          {t("auth.email")}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.email")}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* password */}
      <div>
        <Label htmlFor="password" className="text-white mb-2 block">
          {t("auth.password")}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <Input
            id="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={t("auth.password")}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* confirm password (signup only) */}
      {!isLogin && setConfirmPassword && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden"
        >
          <Label htmlFor="confirmPassword" className="text-white mb-2 block">
            {t("auth.confirm_password")}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.confirm_password")}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
        </motion.div>
      )}
    </>
  );
}
