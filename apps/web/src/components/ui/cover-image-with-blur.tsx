"use client"

import { useEffect, useRef, useState } from "react"

const DECODE_RES = 32

export interface CoverImageWithBlurProps {
  src: string
  alt: string
  /** Optional BlurHash string; when set, shows as placeholder until image loads */
  blurHash?: string | null
  className?: string
  /** Applied to the img (e.g. mask for hero) */
  imgStyle?: React.CSSProperties
  imgClassName?: string
  /** For grid cards: motion.img with hover scale */
  hoverScale?: boolean
}

/**
 * Renders a cover image with an optional BlurHash placeholder.
 * When blurHash is set, the placeholder shows immediately and the image fades in on load.
 */
export function CoverImageWithBlur({
  src,
  alt,
  blurHash,
  className = "",
  imgStyle,
  imgClassName = "",
  hoverScale = false,
}: CoverImageWithBlurProps) {
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Decode and draw blur as soon as we have blurHash (fixed 32x32, CSS scales to fill).
  // No wait for container size — avoids blank gap after skeleton disappears.
  useEffect(() => {
    if (!blurHash) return

    let cancelled = false
    const run = async () => {
      try {
        const { decode } = await import("blurhash")
        const pixels = decode(blurHash, DECODE_RES, DECODE_RES)
        if (cancelled) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = DECODE_RES
        canvas.height = DECODE_RES
        const imageData = ctx.createImageData(DECODE_RES, DECODE_RES)
        imageData.data.set(pixels)
        ctx.putImageData(imageData, 0, 0)
      } catch (e) {
        console.error("[CoverImageWithBlur] blur_hash decode failed:", e)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [blurHash])

  const showPlaceholder = !!blurHash

  const img = (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 w-full h-full object-cover ${imgClassName}`}
      style={{
        ...imgStyle,
        opacity: !blurHash ? 1 : loaded ? 1 : 0,
        transition: "opacity 0.25s ease-out",
      }}
      onLoad={() => setLoaded(true)}
    />
  )

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {showPlaceholder && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          width={DECODE_RES}
          height={DECODE_RES}
          aria-hidden
        />
      )}
      {hoverScale ? (
        <div className="absolute inset-0 overflow-hidden [&>img]:transition-transform [&>img]:duration-300 [&>img]:hover:scale-110">
          {img}
        </div>
      ) : (
        img
      )}
    </div>
  )
}
