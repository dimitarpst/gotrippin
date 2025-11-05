"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Plus, Settings, MapPin, Calendar, Home, Compass, User, Star, Search, ChevronDown, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dock, DockIcon } from "@/components/ui/dock"
import { useState, useMemo, useRef, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Trip {
  id: string
  destination: string
  image: string
  startDate: string
  endDate: string
  daysUntil: number
  duration: number
}

const mockTrips: Trip[] = [
  {
    id: "1",
    destination: "Cyprus",
    image: "/beautiful-cyprus-beach-sunset.jpg",
    startDate: "26 Oct",
    endDate: "30 Oct",
    daysUntil: 20,
    duration: 5,
  },
  {
    id: "2",
    destination: "Tokyo",
    image: "/tokyo-night-skyline.png",
    startDate: "15 Nov",
    endDate: "22 Nov",
    daysUntil: 45,
    duration: 7,
  },
  {
    id: "3",
    destination: "Santorini",
    image: "/santorini-white-buildings-blue-domes-sunset.jpg",
    startDate: "5 Dec",
    endDate: "12 Dec",
    daysUntil: 65,
    duration: 7,
  },
]

interface TripsListProps {
  onSelectTrip: (tripId: string) => void
  onCreateTrip: () => void
}

const recommendedDestinations = [
  {
    id: "1",
    name: "Blue Lagoon",
    location: "Europe, Iceland",
    image: "/blue-lagoon-iceland-geothermal-spa.jpg",
    isFavorite: true,
  },
  {
    id: "2",
    name: "Maldive Islands",
    location: "Indian Ocean",
    image: "/maldives-tropical-beach-resort.jpg",
    isFavorite: true,
  },
  {
    id: "3",
    name: "Mountain Peak",
    location: "United States",
    image: "/mountain-peak-forest-sunrise.jpg",
    isFavorite: true,
  },
  {
    id: "4",
    name: "Santorini",
    location: "Greece",
    image: "/santorini-white-buildings-sunset.jpg",
    isFavorite: false,
  },
]

export default function TripsList({ onSelectTrip, onCreateTrip }: TripsListProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all")
  const [viewMode, setViewMode] = useState<"my-trips" | "friends-trips">("my-trips")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasTrips = mockTrips.length > 0

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  const searchResults = useMemo(() => {
    if (!searchQuery) return { trips: [], destinations: [] }

    const query = searchQuery.toLowerCase()
    const trips = mockTrips.filter((trip) => trip.destination.toLowerCase().includes(query))
    const destinations = recommendedDestinations.filter(
      (dest) => dest.name.toLowerCase().includes(query) || dest.location.toLowerCase().includes(query),
    )

    return { trips, destinations }
  }, [searchQuery])

  const filteredTrips = useMemo(() => {
    const now = new Date()
    return mockTrips.filter((trip) => {
      if (activeFilter === "all") return true
      if (activeFilter === "upcoming") return trip.daysUntil > 0
      if (activeFilter === "past") return trip.daysUntil < 0
      return true
    })
  }, [activeFilter])

  return (
    <div className="min-h-screen relative pb-32 overflow-y-auto scrollbar-hide">
      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.08]"
          style={{ background: "rgba(14, 11, 16, 0.8)" }}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, type: "spring", damping: 20 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo/Title */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#ff6b6b" }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <MapPin className="w-5 h-5 text-white" />
                </motion.div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      className="flex items-center gap-2 text-2xl font-bold text-white hover:text-white/90 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {viewMode === "my-trips" ? "My Trips" : "Friends' Trips"}
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-[#1a1625] border-white/[0.08] backdrop-blur-xl">
                    <DropdownMenuItem
                      onClick={() => setViewMode("my-trips")}
                      className="text-white hover:bg-white/[0.08] cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 mr-2" style={{ color: "#ff6b6b" }} />
                      My Trips
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setViewMode("friends-trips")}
                      className="text-white hover:bg-white/[0.08] cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" style={{ color: "#ff6b6b" }} />
                      Friends' Trips
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <motion.button
                  className="px-4 py-2 rounded-full font-medium text-sm"
                  style={{
                    background: "rgba(255, 107, 107, 0.15)",
                    color: "#ff6b6b",
                  }}
                  whileHover={{
                    scale: 1.05,
                    background: "rgba(255, 107, 107, 0.25)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Future trips
                </motion.button>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  {!searchOpen ? (
                    <motion.button
                      key="search-button"
                      onClick={() => setSearchOpen(true)}
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255, 255, 255, 0.08)" }}
                      whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.12)" }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 800, damping: 15 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 800, damping: 20 }}
                    >
                      <Search className="w-5 h-5 text-white" />
                    </motion.button>
                  ) : (
                    <motion.div
                      key="search-bar"
                      className="relative flex items-center gap-2 rounded-full px-4 h-12"
                      style={{ background: "rgba(255, 255, 255, 0.08)" }}
                      initial={{ width: 48, opacity: 0 }}
                      animate={{ width: 320, opacity: 1 }}
                      exit={{ width: 48, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 1000, damping: 25 }}
                    >
                      <Search className="w-5 h-5 text-white/60 flex-shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search trips..."
                        className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
                      />
                      <motion.button
                        onClick={() => {
                          setSearchOpen(false)
                          setSearchQuery("")
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255, 255, 255, 0.1)" }}
                        whileHover={{ scale: 1.1, background: "rgba(255, 107, 107, 0.3)" }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 800, damping: 15 }}
                      >
                        <X className="w-4 h-4 text-white" />
                      </motion.button>

                      <AnimatePresence>
                        {searchQuery && (
                          <motion.div
                            className="absolute top-full right-0 mt-2 w-full rounded-2xl p-2 border border-white/[0.08] backdrop-blur-xl"
                            style={{ background: "rgba(26, 22, 37, 0.95)" }}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: "spring", stiffness: 800, damping: 20 }}
                          >
                            {searchResults.trips.length === 0 && searchResults.destinations.length === 0 ? (
                              <div className="text-white/60 text-sm py-4 text-center">No results found</div>
                            ) : (
                              <>
                                {searchResults.trips.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-white/40 text-xs font-medium px-3 py-2">Your Trips</div>
                                    {searchResults.trips.map((trip) => (
                                      <motion.button
                                        key={trip.id}
                                        onClick={() => {
                                          onSelectTrip(trip.id)
                                          setSearchOpen(false)
                                          setSearchQuery("")
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left"
                                        whileHover={{ background: "rgba(255, 255, 255, 0.08)" }}
                                        transition={{ duration: 0.1 }}
                                      >
                                        <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#ff6b6b" }} />
                                        <span className="text-white text-sm">{trip.destination}</span>
                                      </motion.button>
                                    ))}
                                  </div>
                                )}
                                {searchResults.destinations.length > 0 && (
                                  <div>
                                    <div className="text-white/40 text-xs font-medium px-3 py-2">Destinations</div>
                                    {searchResults.destinations.map((dest) => (
                                      <motion.button
                                        key={dest.id}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left"
                                        whileHover={{ background: "rgba(255, 255, 255, 0.08)" }}
                                        transition={{ duration: 0.1 }}
                                      >
                                        <Compass className="w-4 h-4 flex-shrink-0" style={{ color: "#ff6b6b" }} />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-white text-sm">{dest.name}</div>
                                          <div className="text-white/40 text-xs">{dest.location}</div>
                                        </div>
                                      </motion.button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", damping: 20 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recommended</h2>
            <motion.button
              className="text-[#ff6b6b] font-semibold text-sm hover:text-[#ff8585] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All
            </motion.button>
          </div>

          <div className="flex gap-4 pb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
            {recommendedDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                className="flex-shrink-0 w-[280px] group cursor-pointer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.03, type: "spring", stiffness: 600, damping: 20 }}
                whileHover={{ y: -8 }}
                style={{ transition: "transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                <Card className="border-white/[0.08] rounded-2xl shadow-lg bg-[var(--surface)] backdrop-blur-xl hover:border-white/[0.15] hover:shadow-2xl hover:shadow-[#ff6b6b]/10 transition-all duration-200">
                  <div className="relative h-[200px] rounded-2xl overflow-hidden">
                    <motion.img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 800, damping: 20 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <motion.div
                      className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255, 255, 255, 0.2)" }}
                      whileHover={{ scale: 1.1, background: "rgba(255, 107, 107, 0.3)" }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 800, damping: 15 }}
                    >
                      <Star
                        className="w-4 h-4"
                        fill={destination.isFavorite ? "#ff6b6b" : "none"}
                        stroke={destination.isFavorite ? "#ff6b6b" : "white"}
                      />
                    </motion.div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#ff6b6b] transition-colors duration-150">
                        {destination.name}
                      </h3>
                      <div className="flex items-center gap-1 text-white/70 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{destination.location}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filters & View Toggle */}
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", damping: 20 }}
        >
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {(["all", "upcoming", "past"] as const).map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all relative overflow-hidden"
                style={{
                  background: activeFilter === filter ? "#ff6b6b" : "rgba(255, 255, 255, 0.08)",
                  color: activeFilter === filter ? "white" : "var(--muted)",
                }}
                whileHover={{
                  scale: 1.05,
                  background: activeFilter === filter ? "#ff6b6b" : "rgba(255, 255, 255, 0.12)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {activeFilter === filter && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "#ff6b6b" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === "all" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Badge
                        className="text-xs border-0 px-2 py-0.5"
                        style={{
                          background: activeFilter === filter ? "rgba(255, 255, 255, 0.2)" : "#ff6b6b",
                          color: "white",
                        }}
                      >
                        {mockTrips.length}
                      </Badge>
                    </motion.span>
                  )}
                </span>
              </motion.button>
            ))}
          </div>

          {hasTrips ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 25,
                      delay: index * 0.05,
                    }}
                    layout
                    whileHover={{ y: -8 }}
                  >
                    <Card
                      className="border-white/[0.08] rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 bg-[var(--surface)] backdrop-blur-xl group hover:border-white/[0.15] hover:shadow-2xl hover:shadow-[#ff6b6b]/10"
                      onClick={() => onSelectTrip(trip.id)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <motion.img
                          src={trip.image || "/placeholder.svg"}
                          alt={trip.destination}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 group-hover:from-black/90 transition-all duration-300" />

                        <motion.div
                          className="absolute top-3 right-3"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Badge
                            className="text-white border-0 text-xs font-semibold shadow-lg"
                            style={{ background: "#ff6b6b" }}
                          >
                            {trip.daysUntil} days
                          </Badge>
                        </motion.div>

                        <motion.div
                          className="absolute bottom-0 left-0 right-0 p-4"
                          initial={{ y: 0 }}
                          whileHover={{ y: -4 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff6b6b] transition-colors duration-200">
                            {trip.destination}
                          </h3>
                          <div className="flex items-center gap-3 text-white/80 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {trip.startDate} → {trip.endDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{trip.duration} days</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(255, 107, 107, 0.1)" }}
              >
                <MapPin className="w-10 h-10" style={{ color: "#ff6b6b" }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No trips yet</h2>
              <p className="text-[var(--muted)] mb-6 text-center max-w-md">
                Start planning your next adventure by creating your first trip
              </p>
              <Button
                onClick={onCreateTrip}
                className="rounded-xl font-semibold shadow-lg"
                style={{ background: "#ff6b6b" }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Trip
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {hasTrips && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        >
          <Dock iconSize={56} iconMagnification={72} iconDistance={150}>
            <DockIcon>
              <motion.div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255, 255, 255, 0.08)" }}
                whileHover={{
                  background: "rgba(255, 255, 255, 0.15)",
                  scale: 1.05,
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Home className="w-6 h-6 text-white" />
              </motion.div>
            </DockIcon>

            <DockIcon>
              <motion.div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255, 255, 255, 0.08)" }}
                whileHover={{
                  background: "rgba(255, 255, 255, 0.15)",
                  scale: 1.05,
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Compass className="w-6 h-6 text-white" />
              </motion.div>
            </DockIcon>

            <DockIcon onClick={onCreateTrip}>
              <motion.div
                className="w-full h-full rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "#ff6b6b" }}
                whileHover={{
                  scale: 1.1,
                  rotate: 90,
                  boxShadow: "0 0 40px rgba(255, 107, 107, 0.8)",
                }}
                whileTap={{ scale: 0.9, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
              </motion.div>
            </DockIcon>

            <DockIcon>
              <motion.div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255, 255, 255, 0.08)" }}
                whileHover={{
                  background: "rgba(255, 255, 255, 0.15)",
                  scale: 1.05,
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Settings className="w-6 h-6 text-white" />
              </motion.div>
            </DockIcon>

            <DockIcon>
              <motion.div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255, 255, 255, 0.08)" }}
                whileHover={{
                  background: "rgba(255, 255, 255, 0.15)",
                  scale: 1.05,
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <User className="w-6 h-6 text-white" />
              </motion.div>
            </DockIcon>
          </Dock>
        </motion.div>
      )}
    </div>
  )
}
