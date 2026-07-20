"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsTab({ adminEmail }) {
  const [isRecruiting, setIsRecruiting] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Own email change state
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Fetch recruitment setting from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .eq("id", "is_recruiting")
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setIsRecruiting(data.value === true);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Update recruitment status setting in Supabase
  const handleToggleRecruitment = async (newValue) => {
    try {
      setIsRecruiting(newValue);
      const { error } = await supabase
        .from("settings")
        .upsert({ id: "is_recruiting", value: newValue });

      if (error) throw error;
    } catch (err) {
      console.error("Error updating recruitment status:", err);
      alert("Failed to update recruitment status: " + err.message);
    }
  };

  const handleChangeOwnEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert("Please enter a valid email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      alert("Invalid email format.");
      return;
    }
    const confirmChange = window.confirm(`Are you sure you want to change your login email address to "${newEmail.trim().toLowerCase()}"?`);
    if (!confirmChange) return;

    setSavingEmail(true);
    try {
      // 1. Update in Supabase Auth (sends verification mail)
      const { error: authError } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
      });
      if (authError) throw authError;

      // 2. Also update profile email in database 'users' table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ email: newEmail.trim().toLowerCase() })
          .eq('uid', user.id);
      }

      alert("Email update request sent! Please check both your old and new inbox to confirm the change.");
      setNewEmail("");
    } catch (err) {
      console.error("Error changing email:", err);
      alert("Failed to update email: " + (err.message || err));
    } finally {
      setSavingEmail(false);
    }
  };

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
      {/* Recruitment Toggle Panel */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-white/[0.04] bg-black/30">
          <h2 className="font-orbitron text-sm font-bold text-gray-400 tracking-wider">
            CLUB RECRUITMENT CONTROL
          </h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm">Recruitment Toggle</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Toggling this updates the home page badge status. When active, it displays "Now Recruiting Members". When deactivated, it shows "Welcome Club Members".
              </p>
            </div>

            {loading ? (
              <span className="text-xs text-gray-500 italic font-mono">Syncing...</span>
            ) : (
              <button
                onClick={() => handleToggleRecruitment(!isRecruiting)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none focus:outline-none ${
                  isRecruiting ? "bg-purple-600" : "bg-slate-800"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isRecruiting ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            )}
          </div>

          <div className="mt-5 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                isRecruiting ? "bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" : "bg-green-500 shadow-[0_0_8px_#22c55e]"
              }`}
            />
            <span className="text-xs font-mono text-gray-400">
              Live Badge Status:{" "}
              <span className={isRecruiting ? "text-purple-400 font-bold" : "text-green-400 font-bold"}>
                {isRecruiting ? "NOW RECRUITING MEMBERS" : "WELCOME CLUB MEMBERS"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Change Login Email Panel */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-white/[0.04] bg-black/30">
          <h2 className="font-orbitron text-sm font-bold text-gray-400 tracking-wider">
            CHANGE MY EMAIL
          </h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleChangeOwnEmail} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                New Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="enter new email address..."
                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-2 text-sm text-white font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={savingEmail || !newEmail.trim()}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-orbitron font-bold text-xs rounded transition-colors uppercase cursor-pointer"
            >
              {savingEmail ? "Sending Confirmation..." : "Update Email"}
            </button>
          </form>
          
          <div className="mt-4 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
            <p className="text-[10px] font-mono text-gray-500 leading-relaxed">
              Note: Updating your email sends a confirmation link to the new address. Your login credentials and database profile will update once verified.
            </p>
          </div>
        </div>
      </div>

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
