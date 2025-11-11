"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TripsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to root page since trips functionality is now on the homepage
    router.replace('/')
  }, [router])

  return null
}

