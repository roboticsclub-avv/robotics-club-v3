"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function MemberPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold font-orbitron text-white mb-2">
          MEMBER PORTAL
        </h1>
        <p className="text-green-400 font-mono text-sm mb-6">&gt; Access granted. Welcome member...</p>
      </div>
    </ProtectedRoute>
  );
}
