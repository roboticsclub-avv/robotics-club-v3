"use client";

import React from "react";

export default function FormProgress({ currentStep, totalSteps }) {
  const percentage = ((currentStep - 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="w-full h-1 bg-slate-800 relative overflow-hidden">
        <div
          className="h-full bg-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
        <span className="text-gray-500 text-xs font-mono font-bold">ROBOTICS CLUB SECTOR</span>
        <span className="text-cyan-400 font-mono font-bold text-sm">
          {currentStep} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
