"use client";

import React from "react";
import Link from "next/link";

export default function DashboardHeader({ activeTab, adminEmail, onLogout, toggleSidebar }) {
  return (
    <header className="flex justify-between items-center bg-[#111111]/80 backdrop-blur-md border-b border-white/[0.05] px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-400 hover:text-cyan-400 transition-colors p-1"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div>
          <h1 className="text-xl font-bold font-orbitron text-cyan-400 tracking-wider uppercase">
            {activeTab === "applicants" && "RECRUITMENT QUEUE"}
            {activeTab === "team" && "ROBOTICS TEAM"}
            {activeTab === "events" && "EVENTS REGISTER"}
            {activeTab === "settings" && "SYSTEM CONFIG"}
          </h1>
          <p className="text-[10px] text-gray-500 font-mono hidden sm:block">
            SYSTEM.STATUS // <span className="text-green-500 animate-pulse font-bold">ONLINE</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Environment Tag & Website Link */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          >
            <span>🏠</span>
            <span>Main Website</span>
          </Link>
          <div className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-800/30 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-widest font-semibold uppercase">
              ADMIN_ACCESS_LEVEL_1
            </span>
          </div>
        </div>

        {/* User profile identifier */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-300 font-inter">{adminEmail || "Admin User"}</p>
            <p className="text-[9px] text-purple-400 font-mono uppercase tracking-wider">Superuser</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center font-orbitron font-bold text-sm text-white shadow-[0_0_10px_rgba(8,145,178,0.2)]">
            {adminEmail ? adminEmail[0].toUpperCase() : "A"}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="text-xs bg-red-950/20 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 transition-all font-mono font-bold px-3 py-1.5 rounded-md hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
}
