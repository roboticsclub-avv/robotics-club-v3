"use client";

import React, { createContext, useState, useEffect } from "react";
import { auth } from "@/lib/firebase/auth";

export const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.role === "admin",
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
