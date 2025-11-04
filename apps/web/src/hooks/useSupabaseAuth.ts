"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

// Extend the user with avatar_color
interface ExtendedUser extends User {
  avatar_color?: string | null;
}

interface UseSupabaseAuth {
  user: ExtendedUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
}

export function useSupabaseAuth(): UseSupabaseAuth {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 🧠 Watch for auth state changes and set user
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        // fetch the avatar color from profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_color")
          .eq("id", currentUser.id)
          .single();

        // attach color
        setUser({
          ...currentUser,
          avatar_color: profileData?.avatar_color || null,
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Initial check on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_color")
          .eq("id", currentUser.id)
          .single();

        setUser({
          ...currentUser,
          avatar_color: profileData?.avatar_color || null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔑 Login
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const signedUser = data.user;
    if (signedUser) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_color")
        .eq("id", signedUser.id)
        .single();

      setUser({
        ...signedUser,
        avatar_color: profileData?.avatar_color || null,
      });
    }
  };

  // 🆕 Register
  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/",
        data: { full_name: name },
      },
    });
    if (error) throw error;

    const newUser = data.user;
    if (!newUser) return;

    // Generate dark, high-contrast color (better against white)
    const randomColor = `#${Array.from({ length: 3 }, () =>
      Math.floor(Math.random() * 128)
        .toString(16)
        .padStart(2, "0")
    ).join("")}`;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: newUser.id, avatar_color: randomColor });

    if (profileError)
      console.error("Failed to save avatar color:", profileError.message);
  };

  // 🚪 Logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  // ✉️ Resend confirmation email
  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  };

  return { user, loading, signIn, signUp, signOut, resendConfirmation };
}
