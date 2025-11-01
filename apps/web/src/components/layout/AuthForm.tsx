"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, ArrowRight, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(isLogin ? "Login" : "Register", { email, password, name })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div
          className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #ff6b6b 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #ff6b6b 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 25 }}
        className="w-full max-w-md"
      >
        <div className="bg-[var(--surface)]/80 backdrop-blur-xl rounded-2xl p-8 shadow-card border border-white/10">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Go Trippin'
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[var(--muted)]"
            >
              {isLogin ? "Welcome back!" : "Start your journey"}
            </motion.p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-black/30 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className="flex-1 relative py-2.5 text-sm font-medium transition-colors duration-200"
            >
              {isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[var(--accent)] rounded-lg"
                  transition={{ type: "spring", stiffness: 600, damping: 25 }}
                />
              )}
              <span className={`relative z-10 ${isLogin ? "text-white" : "text-[var(--muted)]"}`}>Login</span>
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className="flex-1 relative py-2.5 text-sm font-medium transition-colors duration-200"
            >
              {!isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[var(--accent)] rounded-lg"
                  transition={{ type: "spring", stiffness: 600, damping: 25 }}
                />
              )}
              <span className={`relative z-10 ${!isLogin ? "text-white" : "text-[var(--muted)]"}`}>Register</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 25 }}
                >
                  <Label htmlFor="name" className="text-white mb-2 block">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-white mb-2 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium py-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--accent)]/20 group"
            >
              <span>{isLogin ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8 flex items-center">
            <div className="flex-grow border-t border-white/15" />
            <span className="mx-4 text-sm text-white/60 backdrop-blur-sm px-3 rounded-md">
              Or continue with
            </span>
            <div className="flex-grow border-t border-white/15" />
          </div>


          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-black/30 border-white/10 text-white hover:bg-black/50 hover:border-white/20 py-6 rounded-xl transition-all duration-200"
            >
              <Chrome className="mr-2 w-5 h-5" />
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-sm text-[var(--muted)] mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
