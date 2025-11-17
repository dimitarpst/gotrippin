"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthApiError, type AuthError, type User } from "@supabase/supabase-js";

// Extend the user with profile data
export interface ExtendedUser extends User {
  avatar_color?: string | null;
  preferred_lng?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  accessToken: string | null;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const hasHandledInitialSession = useRef(false);

  const resetClientSession = () => {
    setUser(null);
    setAccessToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      localStorage.removeItem("supabase.auth.token");
    }
  };

  const handleAuthError = async (error: AuthError | null) => {
    if (!error) return false;

    const isInvalidRefreshToken =
      error instanceof AuthApiError &&
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("refresh token");

    if (isInvalidRefreshToken) {
      console.warn("Invalid or expired refresh token. Clearing session.");
      resetClientSession();
      await supabase.auth.signOut();
      setLoading(false);
      return true;
    }

    console.error("Supabase auth error:", error.message);
    return false;
  };

  // Helper function to load user with profile
  const loadUserWithProfile = async (currentUser: User | null) => {
    try {
      if (currentUser) {
        // fetch profile data from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_color, preferred_lng, avatar_url, display_name")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.warn("Failed to load profile:", profileError);
        }

      // Check if we need to sync OAuth data to profile (only on first login)
      let updatedProfileData = profileData;
      const oauthAvatarUrl = currentUser.user_metadata?.avatar_url;
      const oauthDisplayName = currentUser.user_metadata?.full_name ||
                              currentUser.user_metadata?.display_name;

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
            .eq("id", currentUser.id)
            .select("avatar_color, preferred_lng, avatar_url, display_name")
            .single();

          updatedProfileData = updatedProfile;
        } catch (error) {
          console.warn("Failed to update profile with OAuth data:", error);
        }
      }

        // Profile is guaranteed to exist due to database trigger
        setUser({
          ...currentUser,
          avatar_color: updatedProfileData?.avatar_color || null,
          preferred_lng: updatedProfileData?.preferred_lng || "en",
          avatar_url: updatedProfileData?.avatar_url || null,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Unexpected auth load error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    // Force refresh the session to get latest user metadata
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (await handleAuthError(error)) {
      return;
    }

    setAccessToken(session?.access_token ?? null);
    if (session?.user) {
      await loadUserWithProfile(session.user);
    }
  };

  useEffect(() => {
    // Load the current session on mount
    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (await handleAuthError(error)) {
        return;
      }

      setAccessToken(session?.access_token ?? null);
      await loadUserWithProfile(session?.user ?? null);
      hasHandledInitialSession.current = true;
    };

    loadSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!hasHandledInitialSession.current && event === "INITIAL_SESSION") {
        hasHandledInitialSession.current = true;
        return;
      }
      setAccessToken(session?.access_token ?? null);
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
    resetClientSession();
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
    accessToken,
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

