"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function AdminRoute({ children }) {
  const { loading, isAuthenticated, profile } = useAuth();
  const router = useRouter();

  const validDashboardRoles = ["admin", "technical", "ops", "data", "secretary", "media"];
  const isAuthorized = profile && validDashboardRoles.includes(profile.role);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!isAuthorized) {
        router.replace("/");
      }
    }
  }, [loading, isAuthenticated, isAuthorized, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-cyan-400 font-mono">
        &gt; Authorizing credentials...
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return null;
  }

  return children;
}
