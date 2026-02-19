"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Loader2 } from "lucide-react"
import { useImageSearch } from "@/hooks/useImageSearch"
import { useTranslation } from "react-i18next"
import type { CoverPhotoInput } from "@gotrippin/core"

interface BackgroundPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (type: "image", value: CoverPhotoInput) => void
  onSelectColor: (color: string) => void
  defaultSearchQuery?: string
}

const sampleGradients = [
  "linear-gradient(to bottom, #d32f2f 0%, #b71c1c 100%)", // Deep red
  "linear-gradient(to bottom, #1976d2 0%, #0d47a1 100%)", // Deep blue
  "linear-gradient(to bottom, #6a1b9a 0%, #4a148c 100%)", // Deep purple
  "linear-gradient(to bottom, #c2185b 0%, #880e4f 100%)", // Deep pink
  "linear-gradient(to bottom, #00838f 0%, #004d40 100%)", // Deep teal
  "linear-gradient(to bottom, #2e7d32 0%, #1b5e20 100%)", // Deep green
  "linear-gradient(to bottom, #f57c00 0%, #e65100 100%)", // Deep orange
  "linear-gradient(to bottom, #5d4037 0%, #3e2723 100%)", // Deep brown
  "linear-gradient(to bottom, #455a64 0%, #263238 100%)", // Deep blue grey
  "linear-gradient(to bottom, #7b1fa2 0%, #4a148c 100%)", // Deep violet
  "linear-gradient(to bottom, #0277bd 0%, #01579b 100%)", // Deep light blue
  "linear-gradient(to bottom, #00695c 0%, #004d40 100%)", // Deep cyan
  "linear-gradient(to bottom, #c62828 0%, #b71c1c 100%)", // Deep crimson
  "linear-gradient(to bottom, #1565c0 0%, #0d47a1 100%)", // Deep indigo
  "linear-gradient(to bottom, #558b2f 0%, #33691e 100%)", // Deep lime green
]

export function BackgroundPicker({ open, onClose, onSelect, onSelectColor, defaultSearchQuery }: BackgroundPickerProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"images" | "colors">("images")
  const [searchInput, setSearchInput] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const justOpenedRef = useRef(false)
  const { images, loading, loadingMore, error, hasMore, loadMore, setQuery } = useImageSearch()

  // Auto-fill search input with trip title when modal opens
  useEffect(() => {
    if (open && defaultSearchQuery) {
      // Pre-fill the search input with the trip title
      justOpenedRef.current = true
      setSearchInput(defaultSearchQuery)
      // Immediately search with that title
      setQuery(defaultSearchQuery)
      setHasSearched(true)
    } else if (open) {
      // If no default query, reset to empty
      setSearchInput("")
      setHasSearched(false)
    }
  }, [open, defaultSearchQuery, setQuery])

  // Debounced search when user types (only if they've typed something)
  useEffect(() => {
    if (!open) return // Don't search if modal is closed
    if (!searchInput.trim()) return // Don't search if input is empty
    
    // Skip debounced search if we just auto-filled from defaultSearchQuery
    if (justOpenedRef.current) {
      justOpenedRef.current = false
      return
    }

    const timer = setTimeout(() => {
      setQuery(searchInput.trim())
      setHasSearched(true)
    }, 500) // Debounce user input
    
    return () => clearTimeout(timer)
  }, [searchInput, setQuery, open])

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

  const handleImageSelect = (image: any) => {
    onSelect("image", {
      unsplash_photo_id: image.id,
      download_location: image.links.download_location,
      image_url: image.urls.regular,
      photographer_name: image.user.name,
      photographer_url: image.user.links.html,
      blur_hash: image.blur_hash ?? null,
    })
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
                {t('background_picker.cancel')}
              </button>
              <h2 className="text-white text-lg font-semibold">{t('background_picker.title')}</h2>
              <button onClick={onClose} className="text-[#ff6b6b] text-lg font-medium">
                {t('background_picker.done')}
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
                {t('background_picker.images')}
              </button>
              <button
                onClick={() => setActiveTab("colors")}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === "colors" ? "bg-white/20 text-white" : "bg-white/5 text-white/60"
                }`}
              >
                {t('background_picker.colors')}
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
                    placeholder={t('background_picker.search_placeholder')}
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
                      <p>{t('background_picker.error')}</p>
                      <p className="text-sm mt-2">{t('background_picker.check_connection')}</p>
                    </div>
                  ) : images.length === 0 && hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/60">
                      <p className="text-base mb-2">{t('background_picker.no_results')}</p>
                      <p className="text-sm text-white/40">{t('background_picker.search_hint')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {images.map((image, index) => (
                        <button
                          key={`${image.id}-${index}`}
                          onClick={() => handleImageSelect(image)}
                          className="relative aspect-[3/4] rounded-xl overflow-hidden group"
                        >
                          <img
                            src={image.urls.small}
                            alt={image.alt_description || "Travel photo"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Subtle gradient for attribution readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {/* Very subtle attribution - only visible on hover */}
                          <div className="absolute bottom-1.5 left-2 right-2 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-[10px] leading-tight drop-shadow-lg">
                              {t('background_picker.photo_by')}{" "}
                              <a
                                href={`${image.user.links.html}?utm_source=gotrippin&utm_medium=referral`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#ff6b6b]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {image.user.name}
                              </a>
                              {" "}{t('background_picker.on')}{" "}
                              <a
                                href="https://unsplash.com?utm_source=gotrippin&utm_medium=referral"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#ff6b6b]"
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
                  {sampleGradients.map((gradient, index) => (
                    <button
                      key={index}
                      onClick={() => onSelectColor(gradient)}
                      className="aspect-square rounded-xl hover:scale-110 transition-transform shadow-lg"
                      style={{ background: gradient }}
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

