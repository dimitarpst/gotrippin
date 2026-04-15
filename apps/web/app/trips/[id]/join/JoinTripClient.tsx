"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { joinTripByShareCode, ApiError } from "@/lib/api/trips";
import { toast } from "sonner";

export default function JoinTripClient({ shareCode }: { shareCode: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const ran = useRef(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;

    async function run() {
      setMessage(t("trips.join_working"));
      try {
        const res = await joinTripByShareCode(shareCode);
        if (cancelled) return;
        if (res.already_member) {
          toast.info(t("trips.join_already_member"));
        } else {
          toast.success(t("trips.join_success"));
        }
        router.replace(`/trips/${res.share_code}`);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? err.message : t("trips.join_failed");
        console.error("JoinTripClient: join failed", err);
        toast.error(t("trips.join_failed"), { description: msg });
        setMessage(msg);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [shareCode, router, t]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
      <p className="text-sm">{message ?? t("trips.join_working")}</p>
    </div>
  );
}
