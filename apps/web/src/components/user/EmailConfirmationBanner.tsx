"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MailWarning, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function EmailConfirmationBanner() {
  const { t } = useTranslation();
  const { user, resendConfirmation } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await resendConfirmation(user.email);
      setSent(true);
      setTimeout(() => setSent(false), 5000); // Reset after 5s
    } catch (error) {
      console.error("Failed to resend confirmation email:", error);
      // Optionally show an error toast to the user
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.email_confirmed_at) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MailWarning className="w-5 h-5 text-yellow-400" />
          <div>
            <h4 className="font-semibold text-yellow-300">
              {t("profile.confirm_your_email")}
            </h4>
            <p className="text-sm text-yellow-400/70">
              {t("profile.confirm_email_description")}
            </p>
          </div>
        </div>
        <Button
          onClick={handleResend}
          disabled={loading || sent}
          size="sm"
          className="bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/20"
        >
          <Send className="w-4 h-4 mr-2" />
          {sent ? t("profile.confirmation_sent") : t("profile.resend_confirmation")}
        </Button>
      </div>
    </motion.div>
  );
}
