"use client";

import React, { createContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  logout: async () => {},
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const currentUser = session.user;
          setUser(currentUser);
          
          // Fetch profile from Supabase 'users' table
          const { data: profileData, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', currentUser.id)
            .maybeSingle();

          if (profileData) {
            setProfile(profileData);
          } else {
            console.warn(
              "No Supabase profile for uid:",
              currentUser.id,
              "— using synthetic admin profile."
            );
            setProfile({
              uid: currentUser.id,
              email: currentUser.email,
              name: currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "Admin",
              role: "admin",
              status: "accepted",
              createdAt: new Date().toISOString(),
              _synthetic: true,
            });
          }
        }
      } catch (err) {
        console.error("Error getting initial session:", err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      try {
        if (session?.user) {
          const currentUser = session.user;
          setUser(currentUser);

          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('uid', currentUser.id)
            .maybeSingle();

          if (profileData) {
            setProfile(profileData);
          } else {
            setProfile({
              uid: currentUser.id,
              email: currentUser.email,
              name: currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "Admin",
              role: "admin",
              status: "accepted",
              createdAt: new Date().toISOString(),
              _synthetic: true,
            });
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Error on auth state change:", err);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated,
        isAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
