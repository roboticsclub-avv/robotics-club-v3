"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RequisitionForm from "@/components/requisition/RequisitionForm";

export default function RequisitionPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <RequisitionForm />
      </main>
    </ProtectedRoute>
  );
}
