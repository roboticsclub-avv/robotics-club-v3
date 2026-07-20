"use client";

import React from "react";
import Image from "next/image";

export default function MemberProfileCard({ profile }) {
  if (!profile) return null;

  return (
    <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4 font-inter">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
          <h2 className="font-orbitron text-sm font-bold text-gray-200 tracking-wider">
            AUTHENTICATED MEMBER PROFILE
          </h2>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
          READONLY SYNCED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Profile Avatar */}
        <div className="flex flex-col items-center justify-center space-y-2 md:border-r border-white/[0.06] pr-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/40 bg-black/40">
            {profile.photoURL ? (
              <Image
                src={profile.photoURL}
                alt={profile.name || "Member"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold font-orbitron text-purple-400 bg-purple-950/40">
                {profile.name?.charAt(0) || "M"}
              </div>
            )}
          </div>
          <span className="text-xs font-mono text-gray-400">
            {profile.memberId || profile.member_id || "ID: PENDING"}
          </span>
        </div>

        {/* User Details Grid */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-500 block">Full Name</span>
            <span className="text-white font-semibold text-sm">{profile.name || "N/A"}</span>
          </div>

          <div>
            <span className="text-gray-500 block">Email Address</span>
            <span className="text-gray-300 font-mono">{profile.email || "N/A"}</span>
          </div>

          <div>
            <span className="text-gray-500 block">Roll Number / ID</span>
            <span className="text-gray-300 font-mono">{profile.roll_number || profile.memberId || "N/A"}</span>
          </div>

          <div>
            <span className="text-gray-500 block">Department / Branch</span>
            <span className="text-gray-300">{profile.branch || profile.department || "N/A"}</span>
          </div>

          <div>
            <span className="text-gray-500 block">Section & Year</span>
            <span className="text-gray-300">
              {profile.section ? `Section ${profile.section}` : "N/A"} • Year {profile.year || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Phone Number</span>
            <span className="text-gray-300 font-mono">{profile.phone || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
