"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { profile, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (profile?.status !== "accepted") {
        router.replace("/");
      }
    }
  }, [loading, isAuthenticated, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-cyan-400 font-mono">
        &gt; Resolving session...
      </div>
    );
  }

  if (!isAuthenticated || profile?.status !== "accepted") {
    return null;
  }

  return children;
}
