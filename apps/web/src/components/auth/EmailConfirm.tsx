"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface EmailConfirmProps {
  visible: boolean;
  lastEmail: string;
}

export function EmailConfirm({ visible, lastEmail }: EmailConfirmProps) {
  const { t } = useTranslation();
  const { resendConfirmation } = useSupabaseAuth();

  const handleResend = async () => {
    if (!lastEmail) return;
    try {
      await resendConfirmation(lastEmail);
      alert(t("auth.email_resent_success"));
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(t("auth.email_resent_failed") + ": " + msg);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="emailConfirm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="mt-6 bg-black/40 border border-white/10 rounded-xl p-4 text-center backdrop-blur-md"
        >
          <p className="text-white/80 mb-3">
            {t("auth.email_confirm_text")}{" "}
            <span className="font-semibold">{lastEmail}</span>.
          </p>

          <Button
            variant="outline"
            onClick={handleResend}
            className="w-full border-white/20 hover:bg-white/10 transition-colors"
          >
            {t("auth.resend_email")}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
