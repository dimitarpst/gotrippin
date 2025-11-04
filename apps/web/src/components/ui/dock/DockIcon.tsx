"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function DockIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center w-full h-full text-[var(--color-foreground)]", className)}
    >
      {children}
    </div>
  );
}
