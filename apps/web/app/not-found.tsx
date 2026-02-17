import Link from "next/link";
import AuroraBackground from "@/components/effects/aurora-background";

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-white/90 mb-2">404</h1>
          <p className="text-white/70 text-lg mb-2">
            This page isn&apos;t available. The trip may not exist or you may have followed a bad link.
          </p>
          <p className="text-white/50 text-sm mb-8">
            Head back to safety.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-full font-semibold text-white transition-transform hover:scale-105"
              style={{ background: "#ff6b6b" }}
            >
              Go home
            </Link>
            <Link
              href="/trips"
              className="px-6 py-3 rounded-full font-semibold border border-white/20 text-white/90 hover:bg-white/5 transition-colors"
            >
              View my trips
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
