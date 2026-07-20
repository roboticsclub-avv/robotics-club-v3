"use client";

import React from "react";

export default function CountdownWidget({ returnDate, status }) {
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
    badgeText = `Overdue by ${overdueDays} Day${overdueDays > 1 ? "s" : ""}`;
    badgeStyle = "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse shadow-[0_0_10px_#ef4444]";
  } else if (diffDays === 0) {
    badgeText = "Due Today / Return Needed";
    badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_8px_#f59e0b]";
  } else if (diffDays === 1) {
    badgeText = "Return Tomorrow";
    badgeStyle = "bg-amber-500/15 text-amber-400 border-amber-500/20";
  } else if (diffDays <= 5) {
    badgeText = `${diffDays} Days Remaining`;
    badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else {
    badgeText = `${diffDays} Days Remaining`;
    badgeStyle = "bg-teal-500/10 text-teal-400 border-teal-500/20";
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold ${badgeStyle}`}>
      <span className={`w-2 h-2 rounded-full ${isOverdue ? "bg-red-400 animate-ping" : "bg-teal-400"}`} />
      {badgeText}
    </div>
  );
}
