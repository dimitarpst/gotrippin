"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import AuroraBackground from "@/components/effects/aurora-background";
import { GoAiWordmark } from "@/components/ai/go-ai-wordmark";

export default function AiSessionLoader() {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ opacity: [0.82, 1, 0.82] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <GoAiWordmark
              alt={t("ai.title")}
              className="h-16 w-auto max-w-[min(90vw,22rem)] sm:h-20 sm:max-w-[min(90vw,26rem)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
