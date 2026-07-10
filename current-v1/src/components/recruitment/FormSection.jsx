"use client";

import React from "react";

export default function FormSection({ stepNumber, title, helperText, errorMsg, children }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-cyan-400 font-mono font-bold text-lg">{stepNumber} ➜</span>
        <h3 className="text-2xl font-bold font-orbitron text-white leading-tight">
          {title}
        </h3>
        {helperText && <p className="text-slate-500 text-xs font-mono">{helperText}</p>}
      </div>
      
      <div className="pt-2">
        {children}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono rounded max-w-lg">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
