"use client";

import React from "react";

export default function FormProgress({ currentStep, totalSteps }) {
  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div
      className="w-full sticky top-0 z-20"
      style={{
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Glowing progress bar */}
      <div className="w-full h-[2px] relative" style={{ background: "var(--border-subtle)" }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: "linear-gradient(90deg, var(--accent-purple), var(--accent-teal))",
            boxShadow: "0 0 12px var(--accent-teal-glow)",
          }}
        />
      </div>

      {/* Step info row */}
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--accent-teal)" }}
          />
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            ARC // RECRUITMENT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            STEP
          </span>
          <span
            className="font-orbitron font-bold text-sm tabular-nums"
            style={{ color: "var(--accent-teal)" }}
          >
            {String(currentStep).padStart(2, "0")}
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            / {String(totalSteps).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
