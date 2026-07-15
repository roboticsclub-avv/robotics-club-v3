"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsTab({ adminEmail }) {
  const [environment] = useState(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
        return "Development";
      } else if (hostname.includes("staging") || hostname.includes("test")) {
        return "Staging";
      } else {
        return "Production";
      }
    }
    return "Development";
  });

  const [supabaseUrl] = useState(() => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || "Unknown";
  });

  return (
    <div className="space-y-6 font-inter max-w-3xl">
      {/* System Status Panel */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-white/[0.04] bg-black/30">
          <h2 className="font-orbitron text-sm font-bold text-gray-400 tracking-wider">
            SYSTEM ENVIRONMENT METADATA
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          
          {/* Active Admin */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/[0.02]">
            <span className="text-sm text-gray-500 font-medium">Logged-In Administrator</span>
            <span className="text-sm font-mono text-white mt-1 sm:mt-0 bg-white/[0.02] border border-white/[0.05] px-3 py-1 rounded">
              {adminEmail || "SYSTEM_DAEMON"}
            </span>
          </div>

          {/* Active Environment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/[0.02]">
            <span className="text-sm text-gray-500 font-medium">Environment Stage</span>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded border mt-1 sm:mt-0 ${
              environment === "Production"
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : environment === "Staging"
                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            }`}>
              {environment}
            </span>
          </div>

          {/* Supabase URL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/[0.02]">
            <span className="text-sm text-gray-500 font-medium">Supabase Project URL</span>
            <span className="text-sm font-mono text-cyan-300 mt-1 sm:mt-0 bg-white/[0.02] border border-white/[0.05] px-3 py-1 rounded">
              {supabaseUrl}
            </span>
          </div>

          {/* Software Version */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3">
            <span className="text-sm text-gray-500 font-medium">System Core Version</span>
            <span className="text-sm font-mono text-purple-400 mt-1 sm:mt-0 bg-white/[0.02] border border-white/[0.05] px-3 py-1 rounded font-bold">
              Robotics Club Website v3.0.0
            </span>
          </div>

        </div>
      </div>

      {/* Basic Platform Specs Panel */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg p-5">
        <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest mb-3">
          SYSTEM SPECS
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed font-mono">
          React version: 19.2.3 <br />
          Next.js version: 16.1.6 <br />
          Database Provider: PostgreSQL / Supabase Client SDK <br />
          Security Protocols: Supabase Auth Guard (AdminRoute Level 1 Auth)
        </p>
      </div>
    </div>
  );
}
