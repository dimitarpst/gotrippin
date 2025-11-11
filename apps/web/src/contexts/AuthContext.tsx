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
export interface ExtendedUser extends User {
  avatar_color?: string | null;
  preferred_lng?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
      // Always get the freshest user data from Supabase to ensure identities are up-to-date
      const { data: { user: freshUser } } = await supabase.auth.getUser();

      if (!freshUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // fetch profile data from profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_color, preferred_lng, avatar_url, display_name")
        .eq("id", freshUser.id)
        .single();

      // Check if we need to sync OAuth data to profile (only on first login)
      let updatedProfileData = profileData;
      const oauthAvatarUrl = freshUser.user_metadata?.avatar_url;
      const oauthDisplayName = freshUser.user_metadata?.full_name ||
                              freshUser.user_metadata?.display_name;

      // Only sync OAuth avatar if user doesn't have a custom avatar yet (avatar_url is null)
      // This prevents overwriting user-selected avatars on subsequent logins
      if (oauthAvatarUrl && !profileData?.avatar_url) {
        try {
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .update({
              avatar_url: oauthAvatarUrl,
              ...(oauthDisplayName && !profileData?.display_name && { display_name: oauthDisplayName })
            })
            .eq("id", freshUser.id)
            .select("avatar_color, preferred_lng, avatar_url, display_name")
            .single();

          updatedProfileData = updatedProfile;
        } catch (error) {
          console.warn("Failed to update profile with OAuth data:", error);
        }
      }

      // Profile is guaranteed to exist due to database trigger
      setUser({
        ...freshUser,
        avatar_color: updatedProfileData?.avatar_color || null,
        preferred_lng: updatedProfileData?.preferred_lng || "en",
        avatar_url: updatedProfileData?.avatar_url || null,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const refreshProfile = async () => {
    // Force refresh the session to get latest user metadata
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      await loadUserWithProfile(freshUser);
    }
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

  const signInWithGoogle = async () => {
    const redirectUrl = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    // Clear user state immediately
    setUser(null);
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
    
    // Clear any cached data
    if (typeof window !== "undefined") {
      // Clear session storage
      sessionStorage.clear();
      // Clear specific localStorage keys if needed
      localStorage.removeItem('supabase.auth.token');
    }
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
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

