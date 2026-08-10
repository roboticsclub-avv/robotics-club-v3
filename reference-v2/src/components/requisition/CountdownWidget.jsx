"use client";

import React from "react";

export default function CountdownWidget({ returnDate, takeawayDate, status }) {
  if (!returnDate || status === "returned") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(returnDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let badgeText = "";
  let badgeStyle = "";
  let isOverdue = false;

  if (diffDays < 0) {
    isOverdue = true;
    const overdueDays = Math.abs(diffDays);
    badgeText = `OVERDUE BY ${overdueDays} DAY${overdueDays > 1 ? "S" : ""}`;
    badgeStyle = "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.2)]";
  } else if (diffDays === 0) {
    badgeText = "DUE TODAY";
    badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
  } else if (diffDays === 1) {
    badgeText = "RETURN TOMORROW";
    badgeStyle = "bg-amber-500/15 text-amber-400 border-amber-500/30";
  } else if (diffDays <= 5) {
    badgeText = `${diffDays} DAYS REMAINING`;
    badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else {
    badgeText = `${diffDays} DAYS REMAINING`;
    badgeStyle = "bg-[var(--accent-teal-glow)] text-[var(--accent-teal)] border-[var(--accent-teal)]/30";
  }

  // Calculate progress % if takeaway date is provided
  let progressPercent = 0;
  if (takeawayDate) {
    const start = new Date(takeawayDate);
    start.setHours(0, 0, 0, 0);
    const totalTime = target - start;
    if (totalTime > 0) {
      const elapsed = today - start;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalTime) * 100)));
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5 font-mono">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold font-orbitron tracking-wider ${badgeStyle}`}>
        <span className={`w-2 h-2 rounded-full ${isOverdue ? "bg-red-500 animate-ping" : "bg-[var(--accent-teal)]"}`} />
        {badgeText}
      </div>

      {takeawayDate && (
        <div className="w-32 sm:w-40 bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isOverdue ? "bg-red-500" : "bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-teal)]"
            }`}
            style={{ width: `${isOverdue ? 100 : progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

