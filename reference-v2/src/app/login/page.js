"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // View states: "login" | "forgot" | "reset"
  const [view, setView] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const { isAuthenticated, isAdmin, profile, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect rules for authenticated users
  useEffect(() => {
    if (!loading && isAuthenticated && view === "login") {
      const validDashboardRoles = ["admin", "technical", "ops", "data", "secretary"];
      const isStaff = profile && validDashboardRoles.includes(profile.role);

      if (isStaff) {
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
  }, [isAuthenticated, profile, loading, router, logout, view]);

  // Listen for password recovery redirect
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery") || hash.includes("recovery")) {
      setView("reset");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      console.error("Login failure:", err);
      setErrorMsg(err.message || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const resetRedirectUrl = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/login`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: resetRedirectUrl,
      });
      if (error) throw error;
      setSuccessMsg("Password reset link sent! Check your email inbox.");
      setResetEmail("");
    } catch (err) {
      console.error("Forgot password failure:", err);
      setErrorMsg(err.message || "Failed to trigger recovery email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccessMsg("Password successfully reset! You can now log in.");
      setView("login");
      setNewPassword("");
    } catch (err) {
      console.error("Reset password failure:", err);
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
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
        
        {/* View: LOGIN */}
        {view === "login" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-orbitron text-white mb-2">SYSTEM LOGIN</h2>
              <p className="text-cyan-400 font-mono text-sm">&gt; AUTHENTICATE IDENTITY</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm font-mono text-center">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-sm font-mono text-center">
                {successMsg}
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
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400">Password</label>
                  <button
                    type="button"
                    onClick={() => { setView("forgot"); setErrorMsg(""); setSuccessMsg(""); }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold font-orbitron py-3 rounded transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm uppercase"
              >
                {isSubmitting ? "AUTHENTICATING..." : "LOGIN"}
              </button>
            </form>
          </>
        )}

        {/* View: FORGOT PASSWORD */}
        {view === "forgot" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-orbitron text-white mb-2">RECOVERY</h2>
              <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider">&gt; Trigger Reset Email</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm font-mono text-center">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-sm font-mono text-center">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  id="resetEmail"
                  required
                  disabled={isSubmitting}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-500 text-sm font-mono"
                  placeholder="member@roboticsclub.edu"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold font-orbitron py-3 rounded transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm uppercase"
              >
                {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setView("login"); setErrorMsg(""); setSuccessMsg(""); }}
                  className="text-gray-400 hover:text-white text-xs underline focus:outline-none"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          </>
        )}

        {/* View: RESET PASSWORD */}
        {view === "reset" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-orbitron text-white mb-2">NEW PASSWORD</h2>
              <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider">&gt; UPDATE ACCOUNT PASSWORD</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm font-mono text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-500 text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold font-orbitron py-3 rounded transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm uppercase"
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center text-sm text-gray-400">
          {view === "login" && (
            <p>
              Not a member yet?{" "}
              <Link href="/join-us" className="text-cyan-400 hover:text-cyan-300 underline">
                Join Now
              </Link>
            </p>
          )}
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
