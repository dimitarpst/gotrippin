"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

export default function UserPage() {
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    // If the user is not logged in, redirect to login
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div> // Show a loading state while checking

  return (
    <div>
      <h1>User Page</h1>
      <p>Welcome, {user?.email}</p>
      {/* You can add the avatar here once it's ready */}
    </div>
  )
}
