"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  /** Classes for the visibility toggle (e.g. light text on dark auth backgrounds). */
  toggleClassName?: string;
};

export function PasswordInput({
  className,
  disabled,
  toggleClassName,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative w-full">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        disabled={disabled}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground",
          toggleClassName,
        )}
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff className="size-4 shrink-0" aria-hidden />
        ) : (
          <Eye className="size-4 shrink-0" aria-hidden />
        )}
      </Button>
    </div>
  );
}
