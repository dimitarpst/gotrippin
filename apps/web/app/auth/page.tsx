"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth/AuthForm"
import { useAuth } from "@/contexts/AuthContext"

export default function AuthPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Redirect to home if user is already authenticated
    if (!loading && user) {
      router.push("/")
    }
  }, [user, loading, router])

  // Show nothing while checking auth status
  if (loading) {
    return null
  }

  // Don't render auth form if user is logged in (redirect will happen)
  if (user) {
    return null
  }

  return <AuthForm />
}

