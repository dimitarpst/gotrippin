"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  size: number
}

export default function FloatingParticles({ count = 20 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
    }))
    setParticles(newParticles)
  }, [count])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute inset-0 transition-all duration-300 ease-out"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 107, 107, 0.15) 0%, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(138, 43, 226, 0.1) 0%, transparent 50%)`,
        }}
      />
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: "radial-gradient(circle, rgba(255,107,107,0.4) 0%, rgba(255,107,107,0) 70%)",
            filter: "blur(1px)",
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  )
}
