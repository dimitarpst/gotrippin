"use client";

import { motion } from "framer-motion";
import AuroraBackground from "@/components/effects/aurora-background";
import { Bot } from "lucide-react";

export default function AiSessionLoader() {
  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10">
        <motion.div
          className="rounded-2xl bg-card/80 backdrop-blur-md border border-white/10 p-6 flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/20 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(255, 118, 112, 0.2)",
                "0 0 0 12px rgba(255, 118, 112, 0)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Bot className="w-8 h-8 text-[var(--color-accent)]" />
          </motion.div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-2 rounded-full bg-[var(--color-accent)]"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
