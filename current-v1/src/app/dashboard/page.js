"use client";

import React from "react";
import AdminRoute from "@/components/auth/AdminRoute";

export default function DashboardPage() {
  return (
    <AdminRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold font-orbitron text-white mb-2">
          ADMIN DASHBOARD
        </h1>
        <p className="text-red-400 font-mono text-sm mb-6">&gt; Critical sector. Admins only...</p>
      </div>
    </AdminRoute>
  );
}
