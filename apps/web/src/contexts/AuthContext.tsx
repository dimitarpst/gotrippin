"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

// Extend the user with profile data
interface ExtendedUser extends User {
  avatar_color?: string | null;
  preferred_lng?: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to load user with profile
  const loadUserWithProfile = async (currentUser: User | null) => {
    if (currentUser) {
      // fetch profile data from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_color, preferred_lng")
        .eq("id", currentUser.id)
        .single();

      // If profile doesn't exist, create it (handles post-email-confirmation)
      if (profileError && profileError.code === "PGRST116") {
        const randomColor = `#${Array.from({ length: 3 }, () =>
          Math.floor(Math.random() * 128)
            .toString(16)
            .padStart(2, "0")
        ).join("")}`;

        await supabase
          .from("profiles")
          .insert({ id: currentUser.id, avatar_color: randomColor, preferred_lng: "en" });

        setUser({
          ...currentUser,
          avatar_color: randomColor,
          preferred_lng: "en",
        });
      } else {
        setUser({
          ...currentUser,
          avatar_color: profileData?.avatar_color || null,
          preferred_lng: profileData?.preferred_lng || "en",
        });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Load the current session on mount
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await loadUserWithProfile(session?.user ?? null);
    };

    loadSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      await loadUserWithProfile(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const redirectUrl = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: name },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  };

  const refreshProfile = async () => {
    // Force refresh the session to get latest user metadata
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      await loadUserWithProfile(freshUser);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

