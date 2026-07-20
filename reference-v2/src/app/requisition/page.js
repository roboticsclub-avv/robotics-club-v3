"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RequisitionForm from "@/components/requisition/RequisitionForm";

export default function RequisitionPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0a0a0d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <RequisitionForm />
      </main>
    </ProtectedRoute>
  );
}
