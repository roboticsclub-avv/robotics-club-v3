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
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                    name: formData.name.trim(),
                    phone: formData.phone?.trim() || '',
                    branch: formData.branch,
                    year: formData.year,
                    section: formData.section?.trim() || '',
                    interests: formData.interests,
                    reason: formData.reason?.trim() || '',
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Registration failed. Please try again.');
            }

            setSuccess(true);
            setFormData({
                name: "", email: "", password: "", phone: "", branch: "",
                year: "", section: "", interests: "", reason: ""
            });
        } catch (err) {
            console.error("Error registering user:", err);
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-inter outline-none focus:border-cyan-400 transition-colors placeholder-slate-500";
    const selectClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-inter outline-none focus:border-cyan-400 transition-colors";
    const labelClass = "block text-gray-400 text-xs font-semibold font-inter mb-2 tracking-wide uppercase";

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4">
            <div className="glass-card max-w-2xl w-full p-8 md:p-12 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold font-inter text-white mb-2">Join the Club</h2>
                    <p className="text-gray-400 font-inter text-sm">Fill in your details below to apply for membership</p>
                    <button onClick={() => router.push('/')} className="mt-4 inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 font-inter text-xs transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Back to Home
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm font-inter">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm font-inter text-center">
                        <div className="text-2xl mb-2">🎉</div>
                        <div className="font-semibold mb-1">Application Submitted Successfully!</div>
                        <div className="text-green-300/80">Our team will review your profile and you'll be notified via email upon approval.</div>
                        <div className="mt-4">
                            <button onClick={() => router.push('/')} className="text-cyan-400 hover:text-cyan-300 font-inter font-semibold transition-colors">
                                ← Return to Home
                            </button>
                        </div>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Details */}
                        <div className="md:col-span-2">
                            <h3 className="text-cyan-400 font-bold font-inter text-sm mb-4 border-b border-white/10 pb-2 tracking-widest uppercase">Personal Details</h3>
                        </div>
                        <div>
                            <label className={labelClass}>Full Name *</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="Your full name" />
                        </div>
                        <div>
                            <label className={labelClass}>Contact Number</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+91 XXXXXXXXXX" />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Email Address *</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Password *</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} className={inputClass} placeholder="Minimum 6 characters" minLength="6" />
                        </div>

                        {/* Academic Details */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-cyan-400 font-bold font-inter text-sm mb-4 border-b border-white/10 pb-2 tracking-widest uppercase">Academic Profile</h3>
                        </div>
                        <div>
                            <label className={labelClass}>Branch *</label>
                            <select name="branch" required value={formData.branch} onChange={handleChange} className={selectClass}>
                                <option value="">Select Branch</option>
                                <option value="AIE">AIE</option>
                                <option value="CSE">CSE</option>
                                <option value="CCE">CCE</option>
                                <option value="AI-DS">AI-DS</option>
                                <option value="ECE">ECE</option>
                                <option value="CSE-QC">CSE-QC</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Year *</label>
                                <select name="year" required value={formData.year} onChange={handleChange} className={selectClass}>
                                    <option value="">Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Section</label>
                                <input type="text" name="section" value={formData.section} onChange={handleChange} className={inputClass} placeholder="e.g. A" />
                            </div>
                        </div>

                        {/* Club Preferences */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-purple-400 font-bold font-inter text-sm mb-4 border-b border-white/10 pb-2 tracking-widest uppercase">Club Preferences</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Primary Interest *</label>
                            <select name="interests" required value={formData.interests} onChange={handleChange} className={selectClass}>
                                <option value="">Select Interest</option>
                                <option value="Hardware">Hardware & Electronics</option>
                                <option value="Software">Software & AI</option>
                                <option value="Design">3D Design & Printing</option>
                                <option value="Management">Management & PR</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Why do you want to join?</label>
                            <textarea name="reason" value={formData.reason} onChange={handleChange} rows="3" className={inputClass} placeholder="Tell us what excites you about robotics..."></textarea>
                        </div>

                        <div className="md:col-span-2 mt-6">
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold font-inter py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wide">
                                {loading ? "Submitting..." : "Submit Application"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
