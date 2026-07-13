"use client";

import React, { createContext, useState, useEffect } from "react";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";

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
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      try {
        if (currentUser) {
          // User authenticated — fetch Firestore profile
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            // No Firestore document found — this user was likely created directly
            // in the Firebase Console (e.g. admin/staff accounts). Synthesize a
            // minimal profile so dashboard access isn't blocked. Role defaults to
            // 'admin' since only admins can log in without a registration document.
            console.warn(
              "No Firestore profile for uid:",
              currentUser.uid,
              "— using synthetic admin profile. Create a Firestore document to set an explicit role."
            );
            setProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || "Admin",
              role: "admin",
              status: "accepted",
              photoURL: currentUser.photoURL || "",
              createdAt: new Date().toISOString(),
              _synthetic: true, // flag so we can show a banner in the dashboard
            });
          }
          setUser(currentUser);
        } else {
          // User is logged out
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Error loading user auth context profile:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const logout = async () => {
    try {
      setLoading(true);
      await auth.signOut();
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
