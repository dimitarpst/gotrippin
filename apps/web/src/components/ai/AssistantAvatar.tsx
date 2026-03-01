"use client";

import { Bot } from "lucide-react";

export default function AssistantAvatar() {
  return (
    <div
      className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center"
      aria-hidden
    >
      <Bot className="w-4 h-4 text-[var(--color-accent)]" />
    </div>
  );
}
