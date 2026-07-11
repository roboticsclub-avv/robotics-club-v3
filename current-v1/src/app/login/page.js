"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/auth";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isAuthenticated, isAdmin, profile, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect rules for authenticated users
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdmin) {
        router.replace("/dashboard");
      } else if (profile?.status === "accepted") {
        router.replace("/member");
      } else if (profile?.status === "pending") {
        logout(); // Force sign out pending users as per V1 logic
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setErrorMsg("Access Denied: Your application is still PENDING approval.");
      } else if (profile?.status === "rejected") {
        logout(); // Force sign out rejected users
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setErrorMsg("Access Denied: Your application was rejected.");
      } else {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isAdmin, profile, loading, router, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login failure:", err);
      setErrorMsg(err.message || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-cyan-400 font-mono">
        &gt; Checking session status...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a] text-white">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-orbitron text-white mb-2">SYSTEM LOGIN</h2>
          <p className="text-cyan-400 font-mono text-sm">&gt; AUTHENTICATE IDENTITY</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm font-mono text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-500 text-sm"
              placeholder="member@roboticsclub.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              id="password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold font-orbitron py-3 rounded transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm"
          >
            {isSubmitting ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Not a member yet?{" "}
            <Link href="/join-us" className="text-cyan-400 hover:text-cyan-300 underline">
              Join Now
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/" className="text-gray-500 hover:text-gray-300">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
