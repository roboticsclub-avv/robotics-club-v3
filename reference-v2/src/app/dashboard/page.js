"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ApplicantsTab from "./components/ApplicantsTab";
import EventsTab from "./components/EventsTab";
import InventoryTab from "./components/InventoryTab";
import AllocationsTab from "./components/AllocationsTab";
import TeamTab from "./components/TeamTab";
import SettingsTab from "./components/SettingsTab";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("applicants");
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (user) {
                try {
                    const { data: userDoc, error } = await supabase
                        .from('users')
                        .select('role')
                        .eq('uid', user.id)
                        .single();

                    if (!error && userDoc?.role === "admin") {
                        setIsAdmin(true);
                    } else {
                        router.push("/login"); // Not an admin
                    }
                } catch (error) {
                    console.error("Error checking admin access:", error);
                    router.push("/login");
                }
            } else {
                router.push("/login"); // Not logged in
            }
            setLoading(false);
        };

        checkUser();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!session) {
                    router.push("/login");
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-cyan-400 font-orbitron animate-pulse">VERIFYING CREDENTIALS...</div>;
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen text-slate-100 p-4 md:p-8 font-inter relative z-10">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6 pt-16">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-cyan-400" title="Back to Home">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold font-orbitron text-cyan-400">ADMIN DASHBOARD</h1>
                    </div>
                    <div className="text-xs md:text-sm text-slate-400 font-mono">ADMIN_ACCESS_LEVEL_1</div>
                </header>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 md:gap-4 mb-8">
                    {[
                        { id: "applicants", label: "APPLICANTS" },
                        { id: "team", label: "CORE TEAM" },
                        { id: "events", label: "EVENT MANAGEMENT" },
                        { id: "inventory", label: "HARDWARE INVENTORY" },
                        { id: "allocations", label: "ALLOCATION RECORDS" },
                        { id: "settings", label: "SITE SETTINGS" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 md:px-6 py-2 rounded-lg font-orbitron font-bold text-xs md:text-sm transition-all ${activeTab === tab.id
                                ? "bg-gradient-to-r from-purple-600/80 to-cyan-600/80 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)] border border-cyan-400/50"
                                : "glass-card text-slate-400 hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="transition-all animate-fade-in">
                    {activeTab === "applicants" && <ApplicantsTab />}
                    {activeTab === "team" && <TeamTab />}
                    {activeTab === "events" && <EventsTab />}
                    {activeTab === "inventory" && <InventoryTab />}
                    {activeTab === "allocations" && <AllocationsTab />}
                    {activeTab === "settings" && <SettingsTab />}
                </div>
            </div>
        </div>
    );
}
