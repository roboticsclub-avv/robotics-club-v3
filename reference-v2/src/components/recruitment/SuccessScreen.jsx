"use client";

import React from "react";
import Link from "next/link";

export default function SuccessScreen() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 rounded-xl border border-white/5 max-w-md w-full mx-auto">
      <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 mb-6 animate-pulse">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold font-orbitron text-white mb-4">
        APPLICATION <span className="text-cyan-400">SUBMITTED</span>
      </h2>
      
      <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm font-inter">
        Your credentials and profile are successfully recorded. The admissions board is reviewing details. 
        You can attempt to log in once your profile is accepted.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/login"
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-orbitron py-3 rounded text-center transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.2)] text-sm"
        >
          TRY LOGIN NOW
        </Link>
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-300 transition-colors text-xs font-mono"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
