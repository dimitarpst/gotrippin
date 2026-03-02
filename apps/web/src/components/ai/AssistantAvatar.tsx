"use client";

import { Bot } from "lucide-react";

export default function AssistantAvatar() {
  return (
    <div className="relative group" aria-hidden>
      <div className="absolute inset-0 bg-[var(--color-accent)] rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
      <div className="relative w-10 h-10 rounded-full bg-gradient-to-b from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-[var(--color-accent)]/40 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
        <Bot className="w-5 h-5 text-[var(--color-accent)]" />
      </div>
    </div>
  );
}
