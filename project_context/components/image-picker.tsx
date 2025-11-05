"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Plus, Search } from "lucide-react"

interface ImagePickerProps {
  onSelect: (image: string) => void
  onBack: () => void
}

const destinationImages = [
  { url: "/beautiful-cyprus-beach-sunset.jpg", credit: "Yorgos Ntrahas", loading: false, height: "h-64" },
  { url: "/tokyo-night-skyline.png", credit: "Chriso C", loading: false, height: "h-48" },
  {
    url: "/santorini-white-buildings-blue-domes-sunset.jpg",
    credit: "Mehmet Talha",
    loading: false,
    height: "h-72",
  },
  {
    url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a",
    credit: "Leah Kelley",
    loading: false,
    height: "h-56",
  },
  {
    url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    credit: "Mehmet Talha",
    loading: false,
    height: "h-80",
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    credit: "George Chatzh",
    loading: false,
    height: "h-60",
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    credit: "Taso Katsionis",
    loading: true,
    height: "h-52",
  },
  { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19", credit: "Felix", loading: true, height: "h-68" },
  {
    url: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d",
    credit: "John Doe",
    loading: false,
    height: "h-56",
  },
  {
    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
    credit: "Jane Smith",
    loading: false,
    height: "h-72",
  },
]

export default function ImagePicker({ onSelect, onBack }: ImagePickerProps) {
  const [searchQuery, setSearchQuery] = useState("kavala")
  const [activeTab, setActiveTab] = useState<"images" | "colors">("images")

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={onBack}
            className="font-semibold text-lg"
            style={{ color: "var(--accent)" }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <h1 className="text-xl font-semibold text-white">Choose Image</h1>
          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255, 107, 107, 0.15)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("images")}
            className="flex-1 py-3 rounded-xl font-medium transition-all"
            style={{
              background: activeTab === "images" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
              color: activeTab === "images" ? "white" : "rgba(255, 255, 255, 0.5)",
            }}
          >
            Images
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className="flex-1 py-3 rounded-xl font-medium transition-all"
            style={{
              background: activeTab === "colors" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
              color: activeTab === "colors" ? "white" : "rgba(255, 255, 255, 0.5)",
            }}
          >
            Colors
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations..."
            className="w-full pl-12 pr-12 py-3 rounded-xl border border-white/[0.08] text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.15] transition-colors"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255, 255, 255, 0.1)" }}
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="columns-2 gap-3 space-y-3">
          {destinationImages.map((img, index) => (
            <motion.button
              key={index}
              onClick={() => !img.loading && onSelect(img.url)}
              className={`relative ${img.height} w-full rounded-2xl overflow-hidden group break-inside-avoid`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={img.loading}
            >
              <img src={img.url || "/placeholder.svg"} alt={img.credit} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-medium">{img.credit}</p>
              </div>
              {img.loading && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <motion.div
                    className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
