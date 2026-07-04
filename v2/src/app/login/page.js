"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AlertPopup from "@/components/ui/AlertPopup";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        actionLabel: "",
        onAction: null
    });
    const router = useRouter();

    const handleResendConfirmation = async (emailAddress) => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        setError("");
        try {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: emailAddress,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`
                }
            });
            if (resendError) throw resendError;

            setAlertConfig({
                isOpen: true,
                title: "Verification Sent",
                message: `A new confirmation link has been sent to ${emailAddress}. Please verify your email before signing in.`,
                actionLabel: "",
                onAction: null
            });
        } catch (err) {
            console.error("Error resending email:", err);
            setError("Failed to resend verification: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const safeEmail = email?.trim();
        if (!safeEmail) {
            setError("Email address is required.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: safeEmail,
                password,
            });

            if (authError) throw authError;

            const user = authData.user;

            // Check user status in Supabase users table
            const { data: userData, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('uid', user.id)
                .maybeSingle();

            if (dbError) throw dbError;

            if (userData) {
                const dashboardRoles = ['admin', 'data'];
                if (dashboardRoles.includes(userData.role)) {
                    router.push('/dashboard');
                    return;
                }

                if (userData.status === 'pending') {
                    await supabase.auth.signOut();
                    setError("Access Denied: Your application is still PENDING approval.");
                    setLoading(false);
                    return;
                } else if (userData.status === 'rejected') {
                    await supabase.auth.signOut();
                    setError("Access Denied: Your application was rejected.");
                    setLoading(false);
                    return;
                }

                // If accepted/approved → send members to member portal
                router.push('/member');
            } else {
                await supabase.auth.signOut();
                setError("Error: User profile not found in the club database. Please request access or re-apply.");
            }
        } catch (err) {
            console.error("Error logging in:", err);
            if (err.message?.includes("Email not confirmed")) {
                setAlertConfig({
                    isOpen: true,
                    title: "Email Not Verified",
                    message: "You need to verify your email address before logging in. Check your inbox for the verification link or request a new one.",
                    actionLabel: "Resend Email",
                    onAction: () => handleResendConfirmation(safeEmail)
                });
            } else if (err.status === 400 || err.message?.includes("Invalid login credentials")) {
                setError("ACCESS DENIED: Invalid login credentials.");
            } else {
                setError("Login Failed: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-8 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600"></div>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold font-inter text-white mb-2">Welcome Back</h2>
                    <p className="text-gray-400 font-inter text-sm">Sign in to access your account</p>
                    <button onClick={() => router.push('/')} className="mt-4 inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 font-inter text-xs transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Back to Home
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm font-inter">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-cyan-400 font-inter font-semibold text-xs mb-2 uppercase tracking-wide">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                            placeholder="agent@robotics.club"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-cyan-400 font-inter font-semibold text-xs mb-2 uppercase tracking-wide">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold font-inter py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400 font-inter">
                    Don't have an account? <Link href="/join-us" className="text-cyan-400 hover:underline font-semibold">Apply to Join</Link>
                </div>
            </div>

            <AlertPopup
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                actionLabel={alertConfig.actionLabel}
                onAction={alertConfig.onAction}
            />
        </div>
    );
}
