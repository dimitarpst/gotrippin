"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Search } from "lucide-react"

interface BackgroundPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (type: "image" | "color", value: string) => void
}

// Sample images - replace with actual image URLs or Unsplash API
const sampleImages = [
  { id: 1, url: "/beach-sunset.png", name: "Beach Sunset" },
  { id: 2, url: "/majestic-mountain-vista.png", name: "Mountains" },
  { id: 3, url: "/vibrant-city-skyline.png", name: "City" },
  { id: 4, url: "/forest-trees.png", name: "Forest" },
  { id: 5, url: "/ocean-waves.png", name: "Ocean" },
  { id: 6, url: "/desert-dunes.png", name: "Desert" },
  { id: 7, url: "/northern-lights.png", name: "Aurora" },
  { id: 8, url: "/lush-tropical-island.png", name: "Island" },
  { id: 9, url: "/snowy-mountains.png", name: "Snow" },
]

const sampleColors = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f7b731",
  "#5f27cd",
  "#00d2d3",
  "#ff9ff3",
  "#54a0ff",
  "#48dbfb",
  "#1dd1a1",
  "#ee5a6f",
  "#c44569",
  "#f8b500",
  "#6c5ce7",
  "#a29bfe",
]

export function BackgroundPicker({ open, onClose, onSelect }: BackgroundPickerProps) {
  const [activeTab, setActiveTab] = useState<"images" | "colors">("images")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredImages = sampleImages.filter((img) => img.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-[#1c1c1e] rounded-t-3xl max-h-[90vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <button onClick={onClose} className="text-[#ff6b6b] text-lg font-medium">
                Cancel
              </button>
              <h2 className="text-white text-lg font-semibold">Choose Image</h2>
              <button className="text-[#ff6b6b]">
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 py-4">
              <button
                onClick={() => setActiveTab("images")}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === "images" ? "bg-white/20 text-white" : "bg-white/5 text-white/60"
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setActiveTab("colors")}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === "colors" ? "bg-white/20 text-white" : "bg-white/5 text-white/60"
                }`}
              >
                Colors
              </button>
            </div>

            {/* Search bar (only for images) */}
            {activeTab === "images" && (
              <div className="px-6 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search images"
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b6b]/50"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-5 h-5 text-white/40" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {activeTab === "images" ? (
                <div className="grid grid-cols-3 gap-3">
                  {filteredImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => onSelect("image", image.url)}
                      className="relative aspect-[3/4] rounded-xl overflow-hidden group"
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <p className="absolute bottom-2 left-2 right-2 text-white text-sm font-medium truncate">
                        {image.name}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {sampleColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => onSelect("color", color)}
                      className="aspect-square rounded-xl hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
