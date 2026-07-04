"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function JoinUsPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        branch: "",
        year: "",
        section: "",
        interests: "",
        reason: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            const user = authData.user;

            if (!user) {
                throw new Error("Could not create user account.");
            }

            // Store user details in Supabase
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        uid: user.id,
                        email: formData.email,
                        memberId: 'PENDING',
                        role: 'member',
                        name: formData.name,
                        phone: formData.phone || '',
                        branch: formData.branch,
                        year: formData.year,
                        section: formData.section || '',
                        interests: formData.interests,
                        reason: formData.reason || '',
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    }
                ]);

            if (dbError) throw dbError;

            await supabase.auth.signOut(); // Sign out immediately
            setSuccess(true);
            setFormData({
                name: "", email: "", password: "", phone: "", branch: "",
                year: "", section: "", interests: "", reason: ""
            });
        } catch (error) {
            console.error("Error registering user:", error);
            setError("Registration Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4">
            <div className="glass-card max-w-2xl w-full p-8 md:p-12 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold font-orbitron text-white mb-2">JOIN THE CLUB</h2>
                    <p className="text-gray-400 font-mono text-sm">INITIATE RECRUITMENT PROTOCOL</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm font-mono">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm font-mono text-center">
                        Application submitted successfully! Our agents will review your profile. You will be notified via email upon approval.
                        <div className="mt-4">
                            <button onClick={() => router.push('/')} className="text-cyan-400 hover:underline">RETURN TO BASE</button>
                        </div>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Details */}
                        <div className="md:col-span-2">
                            <h3 className="text-cyan-400 font-bold font-orbitron mb-4 border-b border-white/10 pb-2">PERSONAL ID</h3>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-2">FULL NAME *</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-2">CONTACT NUMBER</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-xs mb-2">EMAIL ADDRESS *</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-xs mb-2">PASSWORD *</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400" minLength="6" />
                        </div>

                        {/* Academic Details */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-cyan-400 font-bold font-orbitron mb-4 border-b border-white/10 pb-2">ACADEMIC PROFILE</h3>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-2">BRANCH *</label>
                            <select name="branch" required value={formData.branch} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400">
                                <option value="">Select Branch</option>
                                <option value="CSE">Computer Science</option>
                                <option value="ECE">Electronics</option>
                                <option value="MECH">Mechanical</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">YEAR *</label>
                                <select name="year" required value={formData.year} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400">
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">SECTION</label>
                                <input type="text" name="section" value={formData.section} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400" />
                            </div>
                        </div>

                        {/* Club Details */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-purple-400 font-bold font-orbitron mb-4 border-b border-white/10 pb-2">CLUB PREFERENCES</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-xs mb-2">PRIMARY INTEREST *</label>
                            <select name="interests" required value={formData.interests} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400">
                                <option value="">Select Interest</option>
                                <option value="Hardware">Hardware & Electronics</option>
                                <option value="Software">Software & AI</option>
                                <option value="Design">3D Design & Printing</option>
                                <option value="Management">Management & PR</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-xs mb-2">WHY DO YOU WANT TO JOIN?</label>
                            <textarea name="reason" value={formData.reason} onChange={handleChange} rows="3" className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-cyan-400"></textarea>
                        </div>

                        <div className="md:col-span-2 mt-6">
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold font-orbitron py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                                {loading ? "SUBMITTING DATA..." : "SUBMIT APPLICATION"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
