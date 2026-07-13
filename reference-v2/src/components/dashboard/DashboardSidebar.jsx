"use client";

import React from "react";

export default function DashboardSidebar({ activeTab, setActiveTab, isOpen, toggleSidebar, userRole = "admin" }) {
  const allTabs = [
    {
      id: "applicants",
      label: "APPLICANTS",
      roles: ["admin"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: "team",
      label: "CORE TEAM",
      roles: ["admin", "technical"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: "events",
      label: "EVENT MANAGEMENT",
      roles: ["admin", "ops"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "media",
      label: "MEDIA & GALLERY",
      roles: ["admin", "media"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "inventory",
      label: "HARDWARE INVENTORY",
      roles: ["admin", "data"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: "allocations",
      label: "ALLOCATION RECORDS",
      roles: ["admin", "data"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      )
    },
    {
      id: "meetings",
      label: "MEETINGS & POINTS",
      roles: ["admin", "secretary"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: "settings",
      label: "SITE SETTINGS",
      roles: ["admin"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const allowedTabs = allTabs.filter(tab => tab.roles.includes(userRole));

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 bg-[#0c0c0e] border-r border-white/[0.05] w-64 z-50 flex flex-col justify-between p-6 transform transition-transform duration-300 ease-out md:translate-x-0 md:static md:z-10 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand/Title */}
          <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-cyan-500 flex items-center justify-center font-bold text-black font-orbitron">
                R
              </div>
              <span className="font-orbitron font-extrabold text-sm tracking-wider text-white">
                ROBOTICS CLUB
              </span>
            </div>
            
            {/* Close Button on Mobile */}
            <button
              onClick={toggleSidebar}
              className="md:hidden text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {allowedTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (isOpen) toggleSidebar(); // Close sidebar on mobile select
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-orbitron font-semibold text-xs tracking-wider text-left transition-all border ${
                    isActive
                      ? "bg-cyan-950/20 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(8,145,178,0.1)]"
                      : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className={isActive ? "text-cyan-400" : "text-gray-500"}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info panel */}
        <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3">
          <p className="text-[9px] text-gray-600 font-mono tracking-widest uppercase">
            Platform Engine
          </p>
          <p className="text-xs font-bold text-gray-400 font-orbitron mt-0.5">
            VER_3.0_CODENAME
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[9px] text-cyan-500/80 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            SYS_SHIELD_ACTIVE
          </div>
        </div>
      </aside>
    </>
  );
}
