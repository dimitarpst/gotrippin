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
import { appConfig } from "@/config/appConfig";

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

    // Check for various refresh token error messages
    const errorMessage = error.message?.toLowerCase() || "";
    const isInvalidRefreshToken =
      error instanceof AuthApiError &&
      (errorMessage.includes("refresh token") ||
       errorMessage.includes("invalid refresh token") ||
       errorMessage.includes("refresh token not found") ||
       error.code === "invalid_grant" ||
       error.status === 400);

    if (isInvalidRefreshToken) {
      console.warn("Invalid or expired refresh token. Clearing session.");
      resetClientSession();
      // Silently sign out - don't throw errors if signOut fails
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Ignore sign out errors when token is already invalid
        console.warn("Sign out error (expected):", signOutError);
      }
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

      // Check if we need to sync OAuth data to profile
      let updatedProfileData = profileData;
      const oauthAvatarUrl = currentUser.user_metadata?.avatar_url;
      const oauthDisplayName = currentUser.user_metadata?.full_name ||
                              currentUser.user_metadata?.display_name;

      // Sync OAuth avatar if:
      // 1. User has OAuth avatar from Google
      // 2. Profile doesn't have an avatar_url OR avatar_url is null/empty
      // This ensures Google avatars are always synced on first login, but won't overwrite custom avatars
      const needsAvatarSync = oauthAvatarUrl && (
        !profileData?.avatar_url || 
        profileData.avatar_url === null || 
        profileData.avatar_url === ''
      );
      
      const needsNameSync = oauthDisplayName && (
        !profileData?.display_name || 
        profileData.display_name === null || 
        profileData.display_name === ''
      );

      if (needsAvatarSync || needsNameSync) {
        try {
          const updateData: { avatar_url?: string; display_name?: string } = {};
          if (needsAvatarSync) {
            updateData.avatar_url = oauthAvatarUrl;
          }
          if (needsNameSync) {
            updateData.display_name = oauthDisplayName;
          }

          const { data: updatedProfile } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", currentUser.id)
            .select("avatar_color, preferred_lng, avatar_url, display_name")
            .single();

          updatedProfileData = updatedProfile || profileData;
        } catch (error) {
          console.warn("Failed to update profile with OAuth data:", error);
        }
      }

        // Profile is guaranteed to exist due to database trigger
        const finalUser = {
          ...currentUser,
          avatar_color: updatedProfileData?.avatar_color || null,
          preferred_lng: updatedProfileData?.preferred_lng || "en",
          avatar_url: updatedProfileData?.avatar_url || null,
        };
        
        setUser(finalUser);
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
    // Load the current session on mount. Never leave loading true forever.
    const LOAD_TIMEOUT_MS = 12_000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadSession = async () => {
      try {
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
      } catch (error) {
        const authError = error as AuthError;
        if (await handleAuthError(authError)) {
          return;
        }
        console.error("Unexpected error loading session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    timeoutId = setTimeout(() => {
      setLoading(false);
    }, LOAD_TIMEOUT_MS);

    // Set up auth state listener with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (!hasHandledInitialSession.current && event === "INITIAL_SESSION") {
          hasHandledInitialSession.current = true;
          return;
        }

        // Handle token refresh errors
        if (event === "TOKEN_REFRESHED" && !session) {
          // Token refresh failed - session is null
          console.warn("Token refresh failed. Clearing session.");
          resetClientSession();
          setLoading(false);
          return;
        }

        // Handle successful token refresh - update access token immediately
        // without reloading profile (profile data doesn't change on token refresh)
        if (event === "TOKEN_REFRESHED" && session) {
          console.log("Token refreshed successfully");
          setAccessToken(session.access_token ?? null);
          // Update user object with new session data, but don't reload profile
          if (session.user) {
            setUser((prevUser) => {
              if (!prevUser) {
                // If no previous user, we need to load the profile
                // This shouldn't happen normally, but handle it gracefully
                loadUserWithProfile(session.user).catch(console.error);
                return null; // Will be set by loadUserWithProfile
              }
              // Keep existing profile data, just update the user object
              return {
                ...session.user,
                avatar_color: prevUser.avatar_color,
                preferred_lng: prevUser.preferred_lng,
                avatar_url: prevUser.avatar_url,
              };
            });
          }
          // Ensure loading is false after token refresh
          setLoading(false);
          return;
        }

        // For other events (SIGNED_IN, SIGNED_OUT, USER_UPDATED), reload full profile
        setAccessToken(session?.access_token ?? null);
        await loadUserWithProfile(session?.user ?? null);
      } catch (error) {
        // Catch any errors during auth state change
        const authError = error as AuthError;
        if (await handleAuthError(authError)) {
          return;
        }
        console.error("Error in auth state change:", error);
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
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
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : appConfig.siteUrl;
    const redirectUrl = `${base}/auth/callback`;

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
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : appConfig.siteUrl;
    const redirectUrl = `${base}/auth/callback`;

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
      // Special-case: Supabase already considers the session gone.
      // Treat this as a successful sign-out and just clear local state.
      const msg = error.message || "";
      if (msg.includes("Auth session missing")) {
        console.warn("Sign out called with missing auth session; clearing client state anyway.");
      } else {
        console.error("Sign out error:", error);
        throw error;
      }
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

