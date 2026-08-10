"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function DigitalMemberQR({ profile }) {
  if (!profile) return null;

  const memberName = profile.name || "Club Member";
  const rcMemberId = profile.memberId || profile.member_id || "RC-MEMBER";
  
  // University roll number derived or explicitly stored
  const getRollNumber = () => {
    if (profile.roll_number) return profile.roll_number;
    if (profile.email && profile.email.toLowerCase().startsWith("av.")) {
      return profile.email.split("@")[0].toUpperCase();
    }
    return "NOT ASSIGNED";
  };

  const rollNumber = getRollNumber();

  // Opaque secure QR token payload (NO raw PII: no phone, no email, no raw roll number in QR)
  const qrPayload = JSON.stringify({
    type: "RC_MEMBER_ATTENDANCE",
    token: profile.qr_token || profile.uid,
    v: 1
  });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-xl space-y-6 text-center relative overflow-hidden font-inter">
      {/* Decorative top accent line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--accent-teal)] via-[var(--accent-purple)] to-[var(--accent-orange)]" />

      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-teal)] font-bold bg-[var(--accent-teal-glow)] border border-[var(--accent-teal)]/30 px-3 py-1 rounded-full inline-block">
          DIGITAL MEMBER IDENTITY
        </span>
        <h3 className="text-sm font-bold font-orbitron text-[var(--text-primary)] tracking-wider uppercase pt-2">
          OFFICIAL MEMBER QR
        </h3>
      </div>

      {/* QR Code Container - High Contrast Scanner Safe (Pure White Background, Crisp Black Modules) */}
      <div className="flex justify-center items-center py-2">
        <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-white inline-block relative group transition-transform hover:scale-[1.02]">
          <QRCodeSVG
            value={qrPayload}
            size={190}
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Visible Identity Details Surround */}
      <div className="space-y-3 pt-1 border-t border-[var(--border-subtle)]">
        <div>
          <h4 className="text-base font-extrabold font-orbitron text-[var(--text-primary)] tracking-wide">
            {memberName}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 text-left text-xs font-mono">
          <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-card)] space-y-0.5">
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
              RC MEMBER ID
            </span>
            <span className="text-[var(--accent-purple)] font-bold text-xs truncate block" title={rcMemberId}>
              {rcMemberId}
            </span>
          </div>

          <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-card)] space-y-0.5">
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
              UNIVERSITY ROLL NO.
            </span>
            <span className="text-[var(--accent-orange)] font-bold text-xs truncate block" title={rollNumber}>
              {rollNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center justify-center gap-1.5 pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>SECURE OPAQUE ENCRYPTION TOKEN</span>
      </div>
    </div>
  );
}
