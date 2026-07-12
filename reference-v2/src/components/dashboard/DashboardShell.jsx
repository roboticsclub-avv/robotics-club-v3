"use client";

import React, { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

export default function DashboardShell({ activeTab, setActiveTab, adminEmail, onLogout, userRole = "admin", children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f5f5f5] flex flex-col font-inter">
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
