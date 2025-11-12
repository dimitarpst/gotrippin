"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Search, Loader2 } from "lucide-react"
import { useImageSearch } from "@/hooks/useImageSearch"

interface BackgroundPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (type: "image" | "color", value: string) => void
}

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
  const [searchInput, setSearchInput] = useState("")
  const observerRef = useRef<HTMLDivElement>(null)
  const { images, loading, loadingMore, error, hasMore, loadMore, setQuery, selectImage } = useImageSearch()

  // Load default images when modal opens (only once)
  useEffect(() => {
    if (open && images.length === 0 && !searchInput) {
      setQuery("travel destination")
    }
  }, [open, images.length, searchInput, setQuery])

  // Debounced search (500ms to reduce API calls)
  useEffect(() => {
    if (!open) return // Don't search if modal is closed

    const timer = setTimeout(() => {
      if (searchInput.trim()) {
        setQuery(searchInput)
      } else if (images.length === 0) {
        // Only set default if we have no images
        setQuery("travel destination")
      }
    }, 500) // Increased from 300ms to 500ms for better debouncing
    
    return () => clearTimeout(timer)
  }, [searchInput, setQuery, open, images.length])

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || activeTab !== "images") return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore, activeTab])

  const handleImageSelect = async (imageUrl: string, image: any) => {
    await selectImage(image)
    onSelect("image", imageUrl)
  }

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
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search travel images"
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b6b]/50"
                  />
                  {searchInput && (
                    <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-5 h-5 text-white/40" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {activeTab === "images" ? (
                <>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#ff6b6b] animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/60">
                      <p>{error}</p>
                      <p className="text-sm mt-2">Please check your connection and try again</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {images.map((image, index) => (
                        <button
                          key={`${image.id}-${index}`}
                          onClick={() => handleImageSelect(image.urls.regular, image)}
                          className="relative aspect-[3/4] rounded-xl overflow-hidden group"
                        >
                          <img
                            src={image.urls.small}
                            alt={image.alt_description || "Travel photo"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 text-left">
                            <p className="text-white text-xs">
                              Photo by{" "}
                              <a
                                href={image.user.links.html}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-[#ff6b6b]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {image.user.name}
                              </a>
                            </p>
                            <p className="text-white/60 text-xs">
                              on{" "}
                              <a
                                href="https://unsplash.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-[#ff6b6b]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Unsplash
                              </a>
                            </p>
                          </div>
                        </button>
                      ))}

                      {/* Infinite scroll trigger */}
                      {hasMore && (
                        <div ref={observerRef} className="col-span-3 flex justify-center py-4">
                          {loadingMore && <Loader2 className="w-6 h-6 text-[#ff6b6b] animate-spin" />}
                        </div>
                      )}
                    </div>
                  )}
                </>
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

