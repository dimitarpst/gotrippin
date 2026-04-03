"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuroraBackground from "@/components/effects/aurora-background";
import FloatingHeader from "@/components/layout/FloatingHeader";
import DockBar from "@/components/layout/DockBar";

export default function ExploreUnderDevelopment() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <FloatingHeader />

      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 py-20">
        <div className="flex flex-col items-center text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(255, 118, 112, 0.1)" }}
          >
            <Construction className="w-10 h-10" style={{ color: "#ff7670" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("under_development.title")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("under_development.message")}
          </p>
          <Link href="/trips">
            <Button
              variant="outline"
              className="rounded-xl gap-2 border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("under_development.back_to_trips")}
            </Button>
          </Link>
        </div>
      </div>

      <DockBar onCreateTrip={() => router.push("/trips/create")} />
    </main>
  );
}
