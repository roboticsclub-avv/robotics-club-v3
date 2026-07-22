"use client";

import React from "react";
import useAuth from "@/hooks/useAuth";

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, profile } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-inter">
      <div className="relative w-full max-w-md bg-[#111115] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-orbitron text-sm font-bold text-white tracking-wider">
              MEMBER PROFILE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold transition px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Profile Info */}
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-4 bg-black/40 p-3.5 rounded-xl border border-white/5">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shrink-0">
              {profile?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoURL} alt={profile.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.name ? profile.name[0].toUpperCase() : "👤"}</span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{profile?.name || user?.email?.split("@")[0] || "Member"}</h4>
              <p className="text-xs text-gray-400 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Role</span>
              <p className="text-cyan-400 font-bold font-mono">{profile?.role || "Member"}</p>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Member ID</span>
              <p className="text-purple-400 font-bold font-mono">{profile?.memberId || profile?.member_id || "N/A"}</p>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Department</span>
              <p className="text-gray-300 font-medium">{profile?.branch || profile?.department || "N/A"}</p>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Year & Section</span>
              <p className="text-gray-300 font-medium">Year {profile?.year || "1"} • Sec {profile?.section || "A"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs font-mono transition border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
