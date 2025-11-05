"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import {
  Plus,
  MoreHorizontal,
  Search,
  X,
  Calendar,
  FileText,
  Mail,
  ImageIcon,
  FileType,
  LinkIcon,
  Lock,
  CreditCard,
  Bed,
  Utensils,
  DollarSign,
  Zap,
  Users,
  Settings,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import GlowCard from "./glow-card"

interface TripOverviewProps {
  onNavigate: (screen: "activity" | "flight") => void
  onBack: () => void
}

export default function TripOverview({ onNavigate, onBack }: TripOverviewProps) {
  const [dominantColor, setDominantColor] = useState<string | null>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = "/beautiful-sunset-beach-ocean-sailboat.jpg"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let r = 0,
        g = 0,
        b = 0
      const sampleSize = 10

      for (let i = 0; i < data.length; i += 4 * sampleSize) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }

      const pixelCount = data.length / (4 * sampleSize)
      r = Math.floor(r / pixelCount)
      g = Math.floor(g / pixelCount)
      b = Math.floor(b / pixelCount)

      const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
      setDominantColor(hexColor)
    }
  }, [])

  return (
    <div className="min-h-screen relative" style={{ background: dominantColor || "#0e0b10" }}>
      <div className="relative w-full h-[50vh]">
        <img
          src="/beautiful-sunset-beach-ocean-sailboat.jpg"
          alt="Trip destination"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, ${dominantColor || "#0e0b10"})`,
          }}
        />
      </div>

      <div
        className="absolute inset-0 overflow-y-auto scrollbar-hide"
        style={{
          background: `linear-gradient(to bottom, 
            transparent 0%, 
            transparent 30%,
            ${dominantColor || "#0e0b10"}cc 50%,
            ${dominantColor || "#0e0b10"}cc 100%)`,
        }}
      >
        <div className="relative z-10 px-6 pt-8 flex items-center justify-between">
          <motion.button
            className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
            style={{ background: "rgba(0,0,0,0.3)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoreHorizontal className="w-5 h-5 text-white" />
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(0,0,0,0.3)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              onClick={onBack}
              className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(0,0,0,0.3)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        <motion.div
          className="relative z-10 px-6 pt-20 text-center"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.h1
            className="text-5xl font-bold text-white mb-3 drop-shadow-lg"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Gggggg
          </motion.h1>
          <motion.p
            className="text-white/90 text-base mb-1 drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Starts in 24 days • 10-day trip
          </motion.p>
          <motion.p
            className="text-white/70 text-sm drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            13 Nov → 22 Nov
          </motion.p>
        </motion.div>

        <motion.div
          className="relative z-10 flex justify-center pt-8 pb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={() => onNavigate("activity")}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: "#ff6b6b",
              boxShadow: "0 8px 32px rgba(255, 107, 107, 0.4)",
            }}
            whileHover={{
              scale: 1.1,
              boxShadow: "0 12px 40px rgba(255, 107, 107, 0.6)",
              rotate: 90,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        <div className="relative z-10 px-6 pb-8 space-y-4">
          {/* Itinerary Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <GlowCard>
              <Card
                className="border-white/[0.08] rounded-2xl p-5 overflow-hidden relative"
                style={{
                  background: "#0e0b10",
                  boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.6)",
                  isolation: "isolate",
                }}
              >
                {dominantColor && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at bottom right, ${dominantColor}95 0%, ${dominantColor}50 40%, transparent 75%)`,
                      zIndex: 1,
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none backdrop-blur-[3px] rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    zIndex: 2,
                    WebkitBackdropFilter: "blur(3px)",
                    maskImage: "radial-gradient(white, white)",
                    WebkitMaskImage: "-webkit-radial-gradient(white, white)",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#ff6b6b" }}
                    >
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-white">Itinerary</h2>
                      <span className="text-xs text-[var(--muted)]">Thursday, 13 Nov</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <Plus className="w-4 h-4" style={{ color: "#ff6b6b" }} />
                    <span className="text-[var(--muted)]">Start organizing your itinerary</span>
                  </div>
                  <button className="font-semibold text-sm" style={{ color: "#ff6b6b" }}>
                    View All Days
                  </button>
                </div>
              </Card>
            </GlowCard>
          </motion.div>

          {/* Documents Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <GlowCard>
              <Card
                className="border-white/[0.08] rounded-2xl p-5 overflow-hidden relative"
                style={{
                  background: "#0e0b10",
                  boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.6)",
                  isolation: "isolate",
                }}
              >
                {dominantColor && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at top left, ${dominantColor}90 0%, ${dominantColor}45 40%, transparent 75%)`,
                      zIndex: 1,
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none backdrop-blur-[3px] rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    zIndex: 2,
                    WebkitBackdropFilter: "blur(3px)",
                    maskImage: "radial-gradient(white, white)",
                    WebkitMaskImage: "-webkit-radial-gradient(white, white)",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-base font-semibold text-white">Documents</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="text-xs font-bold px-2 py-1 rounded border-0"
                        style={{ background: "#ff6b6b", color: "white" }}
                      >
                        PRO
                      </Badge>
                      <Lock className="w-4 h-4 text-white/40" />
                    </div>
                  </div>

                  <div className="flex justify-center gap-6 mb-4 py-4">
                    <Mail className="w-6 h-6 text-white/40" />
                    <ImageIcon className="w-6 h-6 text-white/40" />
                    <FileType className="w-6 h-6 text-white/40" />
                    <LinkIcon className="w-6 h-6 text-white/40" />
                  </div>

                  <p className="text-[var(--muted)] text-sm text-center mb-4">
                    Start adding documents to your trip. You can add photos, links, emails, notes and files.
                  </p>

                  <button className="w-full font-semibold text-sm" style={{ color: "#ff6b6b" }}>
                    Add Document
                  </button>
                </div>
              </Card>
            </GlowCard>
          </motion.div>

          {/* Expenses Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <GlowCard>
              <Card
                className="border-white/[0.08] rounded-2xl p-5 overflow-hidden relative"
                style={{
                  background: "#0e0b10",
                  boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.6)",
                  isolation: "isolate",
                }}
              >
                {dominantColor && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at center right, ${dominantColor}88 0%, ${dominantColor}48 40%, transparent 75%)`,
                      zIndex: 1,
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none backdrop-blur-[3px] rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    zIndex: 2,
                    WebkitBackdropFilter: "blur(3px)",
                    maskImage: "radial-gradient(white, white)",
                    WebkitMaskImage: "-webkit-radial-gradient(white, white)",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-base font-semibold text-white">Expenses</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="text-xs font-bold px-2 py-1 rounded border-0"
                        style={{ background: "#ff6b6b", color: "white" }}
                      >
                        PRO
                      </Badge>
                      <Lock className="w-4 h-4 text-white/40" />
                    </div>
                  </div>

                  <div className="flex justify-center gap-6 mb-4 py-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                      <Bed className="w-6 h-6 text-pink-400" />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                  </div>

                  <p className="text-[var(--muted)] text-sm mb-3">
                    Start organizing your trip expenses by adding costs from activities or any other travel-related
                    expenses.
                  </p>

                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" style={{ color: "#ff6b6b" }} />
                    <button className="font-semibold text-sm" style={{ color: "#ff6b6b" }}>
                      Redeem 7 Days Free
                    </button>
                  </div>
                </div>
              </Card>
            </GlowCard>
          </motion.div>

          {/* Automation Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <GlowCard>
              <Card
                className="border-white/[0.08] rounded-2xl p-5 overflow-hidden relative"
                style={{
                  background: "#0e0b10",
                  boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.6)",
                  isolation: "isolate",
                }}
              >
                {dominantColor && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at bottom left, ${dominantColor}92 0%, ${dominantColor}52 35%, transparent 75%)`,
                      zIndex: 1,
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none backdrop-blur-[3px] rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    zIndex: 2,
                    WebkitBackdropFilter: "blur(3px)",
                    maskImage: "radial-gradient(white, white)",
                    WebkitMaskImage: "-webkit-radial-gradient(white, white)",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-base font-semibold text-white">Automation</h2>
                  </div>

                  <p className="text-[var(--muted)] text-sm mb-3">
                    Forward all your reservations to <span style={{ color: "#ff6b6b" }}>my@gotrippin.app</span> and let
                    GoTrippin organize everything for you.
                  </p>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 px-4 rounded-lg font-semibold text-sm"
                      style={{ background: "#ff6b6b", color: "white" }}
                    >
                      Manage
                    </button>
                    <button
                      className="flex-1 py-2 px-4 rounded-lg font-semibold text-sm border border-white/20"
                      style={{ color: "#ff6b6b" }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </Card>
            </GlowCard>
          </motion.div>

          {/* Invite Guests Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <GlowCard>
              <Card
                className="border-white/[0.08] rounded-2xl p-5 overflow-hidden relative"
                style={{
                  background: "#0e0b10",
                  boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.6)",
                  isolation: "isolate",
                }}
              >
                {dominantColor && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at top right, ${dominantColor}85 0%, ${dominantColor}47 40%, transparent 75%)`,
                      zIndex: 1,
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none backdrop-blur-[3px] rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    zIndex: 2,
                    WebkitBackdropFilter: "blur(3px)",
                    maskImage: "radial-gradient(white, white)",
                    WebkitMaskImage: "-webkit-radial-gradient(white, white)",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-base font-semibold text-white">Invite Guests</h2>
                  </div>

                  <p className="text-[var(--muted)] text-sm mb-4">
                    Add frequent guests. They can view, add, edit and remove items, but you're the admin.
                  </p>

                  <button className="w-full font-semibold text-sm" style={{ color: "#ff6b6b" }}>
                    Share Trip
                  </button>
                </div>
              </Card>
            </GlowCard>
          </motion.div>

          <motion.div
            className="flex justify-center pt-4 pb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <motion.button
              className="px-6 py-3 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.1)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Customize</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
