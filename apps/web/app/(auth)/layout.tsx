import type { ReactNode } from "react"
import AuroraBackground from "@/components/effects/aurora-background"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
      {/* Aurora Effect Background */}
      <AuroraBackground className="absolute inset-0 -z-10 opacity-70" />

      {/* Foreground Auth Content */}
      <div className="z-10 w-full max-w-md px-4 py-10">
        {children}
      </div>
    </div>
  )
}
