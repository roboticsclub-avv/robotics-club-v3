"use client";

import React from "react";
import Link from "next/link";

export default function SuccessScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Ambient glow orbs */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "var(--accent-purple-glow)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "var(--accent-teal-glow)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center p-10 max-w-lg w-full mx-auto">
        {/* Animated success icon */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{
            background: "rgba(124, 58, 237, 0.12)",
            border: "1.5px solid rgba(124, 58, 237, 0.35)",
            boxShadow: "0 0 40px rgba(124, 58, 237, 0.25)",
          }}
        >
          <svg
            fill="none"
            stroke="var(--accent-purple)"
            viewBox="0 0 24 24"
            className="w-10 h-10"
            style={{ filter: "drop-shadow(0 0 8px var(--accent-purple))" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {/* Pulse ring */}
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          />
        </div>

        {/* Status chip */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-mono"
          style={{
            background: "rgba(124, 58, 237, 0.08)",
            border: "1px solid rgba(124, 58, 237, 0.25)",
            color: "var(--accent-purple)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--accent-purple)" }}
          />
          APPLICATION RECEIVED
        </div>

        <h2
          className="text-3xl md:text-4xl font-black font-orbitron mb-4 leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          YOU&apos;RE IN THE{" "}
          <span style={{ color: "var(--accent-teal)" }}>QUEUE</span>
        </h2>

        <p
          className="text-sm leading-relaxed mb-10 max-w-sm font-inter"
          style={{ color: "var(--text-secondary)" }}
        >
          Your application and credentials are successfully recorded. The
          admissions board will review your profile — you can log in once
          you&apos;re approved.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/login"
            className="w-full font-bold font-orbitron py-3.5 rounded-xl text-center text-sm transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
              color: "#fff",
              boxShadow: "0 0 24px rgba(124, 58, 237, 0.3)",
            }}
          >
            CHECK LOGIN STATUS
          </Link>
          <Link
            href="/"
            className="text-xs font-mono transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
