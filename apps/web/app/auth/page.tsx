"use client"

import AuthForm from "@/components/auth/AuthForm"
import { useAuth } from "@/contexts/AuthContext"

export default function AuthPage() {
  const { user, loading } = useAuth()

  // Middleware redirects logged-in users to /; show loading until resolved
  if (loading) {
    return null
  }

  if (user) {
    return null
  }

  return <AuthForm />
}

