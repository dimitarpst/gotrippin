import { cn } from "@/lib/utils";

export const GOAI_LOGO_PUBLIC_PATH = "/goai_logo.svg";

export type GoAiWordmarkProps = {
  className?: string;
  /** e.g. `t("ai.title")` — keep in sync with visible branding */
  alt: string;
};

/** Raster wordmark shipped as `/goai_logo.svg` (includes embedded PNG artwork). */
export function GoAiWordmark({ className, alt }: GoAiWordmarkProps) {
  return (
    <img
      src={GOAI_LOGO_PUBLIC_PATH}
      alt={alt}
      width={849}
      height={421}
      decoding="async"
      className={cn("h-8 w-auto max-w-[min(100%,9rem)] shrink-0 object-contain object-left", className)}
    />
  );
}
