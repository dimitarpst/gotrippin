"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout;

    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const code = queryParams.get("code") || hashParams.get("code");
    const error = queryParams.get("error") || hashParams.get("error");
    const errorDescription = queryParams.get("error_description") || hashParams.get("error_description");

    const handleError = (msg: string) => {
      setStatus("error");
      setMessage(msg);
      redirectTimeout = setTimeout(() => router.push("/auth"), 3000);
    };

    if (error) {
      handleError(errorDescription || "Authentication failed");
      return () => {
        clearTimeout(redirectTimeout);
      };
    }

    if (!code) {
      handleError("Invalid authentication link");
      return () => {
        clearTimeout(redirectTimeout);
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && mounted) {
        setTimeout(() => {
          setStatus("success");
          setMessage("Welcome! Redirecting to home...");
        }, 0);
        
        subscription.unsubscribe();
        redirectTimeout = setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else if (event === 'SIGNED_OUT' && mounted) {
        setTimeout(() => {
          setStatus("error");
          setMessage("Authentication failed");
        }, 0);
        
        subscription.unsubscribe();
        redirectTimeout = setTimeout(() => router.push("/auth"), 3000);
      }
    });

    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && mounted) {
        setTimeout(() => {
          setStatus("success");
          setMessage("Welcome! Redirecting...");
        }, 0);
        
        subscription.unsubscribe();
        redirectTimeout = setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    };

    checkSession();

    const failsafe = setTimeout(() => {
      if (mounted) {
        setTimeout(() => {
          setStatus("error");
          setMessage("Authentication is taking too long. Please try again.");
        }, 0);
        
        subscription.unsubscribe();
        redirectTimeout = setTimeout(() => router.push("/auth"), 3000);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(failsafe);
      clearTimeout(redirectTimeout);
    };
  }, [router]);

  return (
      <motion.div
        className="z-10 flex flex-col items-center gap-6 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Status Icon */}
        <div className="relative">
          {status === "loading" && (
            <motion.div
              className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
          
          {status === "success" && (
            <motion.div
              className="w-16 h-16 flex items-center justify-center bg-green-500/20 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <svg
                className="w-10 h-10 text-green-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
          
          {status === "error" && (
            <motion.div
              className="w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Message */}
        <motion.p
          className="text-lg text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>

        {/* Dots animation for loading state */}
        {status === "loading" && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[var(--color-accent)] rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
  );
}

