"use client";

import { cn } from "@/lib/utils";

export const LOGO_PATH = "/logo_gotrippin.svg";
export const LOGO_PATH_SM = "/logo_gotrippin_sm.svg";

export type LogoProps = {
  className?: string;
  /** Use "sm" for compact contexts (e.g. footer). Default is full logo. */
  variant?: "default" | "sm";
};

export function Logo({ className, variant = "default" }: LogoProps) {
  const src = variant === "sm" ? LOGO_PATH_SM : LOGO_PATH;
  return (
    <img
      src={src}
      alt="gotrippin"
      className={cn("h-auto w-auto", className)}
    />
  );
}
