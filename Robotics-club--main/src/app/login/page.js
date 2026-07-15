"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
                .single();

            if (dbError) throw dbError;

            if (userData) {
                if (userData.role === 'admin') {
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

                // If accepted/approved
                router.push('/');
            } else {
                await supabase.auth.signOut();
                setError("Error: User profile not found.");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            if (error.status === 400 || error.message.includes("Invalid login credentials")) {
                setError("ACCESS DENIED: Invalid login credentials.");
            } else {
                setError("Login Failed: " + error.message);
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
                    <h2 className="text-3xl font-bold font-orbitron text-white mb-2">SYSTEM.LOGIN</h2>
                    <p className="text-gray-400 font-mono text-sm">AUTHENTICATE TO ACCESS SECURE AREAS</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm font-mono">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-cyan-400 font-mono text-xs mb-2">EMAIL ADDRESS</label>
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
                        <label className="block text-cyan-400 font-mono text-xs mb-2">PASSWORD</label>
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
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold font-orbitron py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
                    >
                        {loading ? "AUTHENTICATING..." : "INITIATE LOGIN"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    ACCESS DENIED? <Link href="/join-us" className="text-cyan-400 hover:underline">REQUEST ACCESS</Link>
                </div>
            </div>
        </div>
    );
}
