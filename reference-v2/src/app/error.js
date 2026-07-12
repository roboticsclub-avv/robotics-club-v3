"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("Layout-level error captured:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a] text-white">
      <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-bold font-mono text-red-400 mb-6">
        SYSTEM_ERROR // CRITICAL_FAILURE
      </div>
      <h1 className="text-3xl font-bold font-orbitron mb-4">Something went wrong</h1>
      <p className="text-slate-400 mb-8 max-w-sm">
        An unexpected error occurred. The system framework has intercepted the crash.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 font-bold font-orbitron rounded text-sm hover:opacity-90 transition-opacity"
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 font-bold font-orbitron rounded text-sm hover:text-white transition-colors"
        >
          RETURN HOME
        </Link>
      </div>
    </div>
  );
}
