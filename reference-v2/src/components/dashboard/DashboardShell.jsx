"use client";

import React, { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

export default function DashboardShell({ activeTab, setActiveTab, adminEmail, onLogout, userRole = "admin", profile, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isSynthetic = profile?._synthetic && !bannerDismissed;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f5f5f5] flex flex-col font-inter">
      {/* Synthetic profile warning banner */}
      {isSynthetic && (
        <div className="bg-amber-900/40 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-4 text-xs font-mono">
          <span className="text-amber-300">
            ⚠ <strong>No Firestore profile found</strong> for your account. You are using a temporary admin profile.
            Create a document in <code className="bg-black/30 px-1 py-0.5 rounded">Firestore → users → {profile?.uid}</code> with your <code className="bg-black/30 px-1 py-0.5 rounded">role</code> field to persist access.
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-amber-400 hover:text-white shrink-0 px-2 py-1 rounded hover:bg-amber-500/20 transition-colors"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 relative overflow-hidden">
        {/* Responsive Sidebar */}
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          userRole={userRole}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <DashboardHeader
            activeTab={activeTab}
            adminEmail={adminEmail}
            onLogout={onLogout}
            toggleSidebar={toggleSidebar}
          />
          
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

