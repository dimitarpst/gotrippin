"use client"

import { motion } from "framer-motion"
import {
    ChevronLeft,
    Wind,
    Droplets,
    Sun,
    Cloud,
    CloudRain,
    Eye
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useTrip } from "@/hooks/useTrips"
import { use, useEffect, useState } from "react"

// Mock weather data
const WEATHER_DATA = {
    current: {
        temp: 24,
        condition: "Partly Cloudy",
        humidity: 62,
        wind: 19,
        uv: 4,
        visibility: 10,
    },
    hourly: [
        { time: "Now", temp: 24, icon: Sun, active: true },
        { time: "14:00", temp: 25, icon: Cloud, active: false },
        { time: "15:00", temp: 25, icon: Cloud, active: false },
        { time: "16:00", temp: 24, icon: CloudRain, active: false },
        { time: "17:00", temp: 23, icon: CloudRain, active: false },
        { time: "18:00", temp: 22, icon: Cloud, active: false },
    ],
    daily: [
        { day: "Today", high: 26, low: 18, icon: Cloud, rain: 0 },
        { day: "Tue", high: 24, low: 17, icon: CloudRain, rain: 40 },
        { day: "Wed", high: 26, low: 18, icon: Sun, rain: 10 },
        { day: "Thu", high: 23, low: 16, icon: CloudRain, rain: 60 },
        { day: "Fri", high: 28, low: 19, icon: Sun, rain: 0 },
        { day: "Sat", high: 26, low: 18, icon: Cloud, rain: 20 },
        { day: "Sun", high: 22, low: 16, icon: CloudRain, rain: 80 },
    ]
}

interface WeatherPageProps {
    params: Promise<{
        id: string
    }>
}

export default function WeatherPage({ params }: WeatherPageProps) {
    const router = useRouter()
    const resolvedParams = use(params)
    const shareCode = resolvedParams.id
    const { trip, loading } = useTrip(shareCode)
    const [mounted, setMounted] = useState(false)
    const [dominantColor, setDominantColor] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Extract dominant color from trip image (like in trip-overview)
    useEffect(() => {
        if (!trip?.image_url) {
            setDominantColor(null)
            return
        }

        const img = new Image()
        img.crossOrigin = "Anonymous"
        img.src = trip.image_url

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
            r = Math.round(r / pixelCount)
            g = Math.round(g / pixelCount)
            b = Math.round(b / pixelCount)

            const hexColor = `#${[r, g, b].map(x => {
                const hex = x.toString(16)
                return hex.length === 1 ? "0" + hex : hex
            }).join("")}`

            setDominantColor(hexColor)
        }

        img.onerror = () => {
            setDominantColor(null)
        }
    }, [trip?.image_url])

    if (!mounted || loading) {
        return <div className="min-h-screen bg-[#0e0b10]" />
    }

    // Get theme color: use dominant color from image if available, otherwise use trip color, fallback to coral
    // Handle gradient colors - if trip.color is a gradient, use dominant color or fallback
    const isGradient = trip?.color ? trip.color.startsWith('linear-gradient') : false
    const themeColor = trip?.image_url
        ? (dominantColor || trip?.color || '#ff6b6b') // If image exists, prefer dominant color
        : (isGradient ? '#ff6b6b' : (trip?.color || dominantColor || '#ff6b6b')) // If no image, use trip color (unless gradient)

    const location = trip?.destination || "Unknown Location"

    return (
        <div className="min-h-screen bg-[#0e0b10] text-white relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div
                className="fixed top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-30 pointer-events-none"
                style={{ background: themeColor }}
            />
            <div
                className="fixed bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-20 pointer-events-none"
                style={{ background: themeColor }}
            />

            <div className="relative z-10 p-4 pb-20 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pt-2">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform hover:bg-white/20"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold leading-tight">{location}</h1>
                        <span className="text-xs text-white/60">Weather Insights</span>
                    </div>
                </div>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Card
                        className="border-0 overflow-hidden relative rounded-[32px] shadow-2xl p-8"
                        style={{
                            background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}aa 100%)`
                        }}
                    >
                        {/* Glass shine effect */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                        <div className="relative z-10  flex flex-col items-center justify-center text-center">
                            {/* Large Weather Icon with colored background */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="relative mb-6"
                            >
                                <div
                                    className="w-32 h-32 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10"
                                    style={{ background: `${themeColor}40` }}
                                >
                                    <Sun className="w-20 h-20 text-white drop-shadow-lg" />
                                </div>
                            </motion.div>

                            <h2 className="text-8xl font-bold tracking-tighter mb-3 drop-shadow-sm">{WEATHER_DATA.current.temp}°</h2>
                            <p className="text-xl font-medium opacity-90 mb-6">{WEATHER_DATA.current.condition}</p>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${themeColor}40` }}
                                    >
                                        <Wind className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs text-white/60 font-medium">Wind</span>
                                    <span className="text-sm font-bold">{WEATHER_DATA.current.wind} km/h</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${themeColor}40` }}
                                    >
                                        <Droplets className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs text-white/60 font-medium">Humidity</span>
                                    <span className="text-sm font-bold">{WEATHER_DATA.current.humidity}%</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${themeColor}40` }}
                                    >
                                        <Sun className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs text-white/60 font-medium">UV</span>
                                    <span className="text-sm font-bold">{WEATHER_DATA.current.uv}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Hourly Forecast - Pill Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex justify-between overflow-x-auto pb-4 scrollbar-hide gap-3 px-1">
                        {WEATHER_DATA.hourly.map((hour, i) => (
                            <div
                                key={i}
                                className={`
                  flex flex-col items-center gap-3 min-w-[64px] py-4 rounded-[20px] border backdrop-blur-md transition-all
                  ${hour.active
                                        ? 'bg-white/20 border-white/20 shadow-lg scale-105'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'}
                `}
                            >
                                <span className="text-xs font-medium text-white/70">{hour.time}</span>
                                <hour.icon className={`w-6 h-6 ${hour.active ? 'text-white' : 'text-white/80'}`} />
                                <span className="text-lg font-bold">{hour.temp}°</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 7-Day Forecast - Clean List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/5">
                        <h3 className="text-sm font-bold text-white/50 mb-6 uppercase tracking-wider ml-1">7-Day Forecast</h3>
                        <div className="space-y-6">
                            {WEATHER_DATA.daily.map((day, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="w-12 font-medium text-white/90">{day.day}</span>

                                    <div className="flex items-center gap-3 flex-1 px-4 justify-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <day.icon className="w-6 h-6 text-white/90 group-hover:scale-110 transition-transform" />
                                            {day.rain > 0 && (
                                                <span className="text-[10px] font-bold text-blue-300">{day.rain}%</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-32 justify-end">
                                        <span className="text-white/40 text-sm font-medium">{day.low}°</span>
                                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                                            <div
                                                className="absolute h-full rounded-full"
                                                style={{
                                                    left: '20%',
                                                    right: '20%',
                                                    background: themeColor
                                                }}
                                            />
                                        </div>
                                        <span className="font-bold text-white">{day.high}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Insights Grid - Styled cards with colored icon backgrounds */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Wind className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">Wind Speed</div>
                        <div className="text-3xl font-bold mb-1">{WEATHER_DATA.current.wind} <span className="text-lg text-white/50">km/h</span></div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Droplets className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">Humidity</div>
                        <div className="text-3xl font-bold mb-1">{WEATHER_DATA.current.humidity}<span className="text-lg text-white/50">%</span></div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">Visibility</div>
                        <div className="text-3xl font-bold mb-1">{WEATHER_DATA.current.visibility} <span className="text-lg text-white/50">km</span></div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Sun className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">UV Index</div>
                        <div className="text-3xl font-bold mb-1">{WEATHER_DATA.current.uv}</div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
