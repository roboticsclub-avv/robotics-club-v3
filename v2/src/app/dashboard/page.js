"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ApplicantsTab from "./components/ApplicantsTab";
import TeamTab from "./components/TeamTab";
import EventsTab from "./components/EventsTab";
import InventoryTab from "./components/InventoryTab";
import AllocationsTab from "./components/AllocationsTab";
import SettingsTab from "./components/SettingsTab";
import MeetingsTab from "./components/MeetingsTab";

const DASHBOARD_TABS = [
    { id: "applicants", label: "APPLICANTS", roles: ["admin"] },
    { id: "team", label: "CORE TEAM", roles: ["admin", "technical"] },
    { id: "events", label: "EVENT MANAGEMENT", roles: ["admin", "ops"] },
    { id: "inventory", label: "HARDWARE INVENTORY", roles: ["admin", "data"] },
    { id: "allocations", label: "ALLOCATION RECORDS", roles: ["admin", "data"] },
    { id: "meetings", label: "MEETINGS & POINTS", roles: ["admin", "secretary"] },
    { id: "settings", label: "SITE SETTINGS", roles: ["admin"] }
];

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("applicants");
    const [userRole, setUserRole] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
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

                    const validRoles = ["admin", "technical", "ops", "data", "secretary"];
                    if (!error && userDoc && validRoles.includes(userDoc.role)) {
                        setUserRole(userDoc.role);
                        setIsAuthorized(true);
                        
                        // Set the default tab to the first allowed tab for their role
                        const allowed = DASHBOARD_TABS.filter(t => t.roles.includes(userDoc.role));
                        if (allowed.length > 0) {
                            setActiveTab(allowed[0].id);
                        }
                    } else {
                        router.push("/login"); // Not authorized
                    }
                } catch (error) {
                    console.error("Error checking role based access:", error);
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
        return <div className="min-h-screen flex items-center justify-center text-cyan-400 font-inter animate-pulse">VERIFYING CREDENTIALS...</div>;
    }

    if (!isAuthorized) return null;

    const allowedTabs = DASHBOARD_TABS.filter(tab => tab.roles.includes(userRole));

    return (
        <div className="min-h-screen text-slate-100 p-4 md:p-8 font-inter relative z-10">
            <style>{`
                /* Custom premium UI overrides for the admin control panel */
                header h1 {
                    font-family: var(--font-orbitron), sans-serif !important;
                    font-weight: 800 !important;
                    letter-spacing: 0.08em !important;
                    background: linear-gradient(90deg, var(--accent-orange) 0%, #a78bfa 100%);
                    -webkit-background-clip: text !important;
                    -webkit-text-fill-color: transparent !important;
                }

                header button svg {
                    color: var(--accent-orange) !important;
                }

                /* Tab button override styles */
                .tab-button-active {
                    background: linear-gradient(90deg, var(--accent-purple) 0%, var(--accent-orange) 100%) !important;
                    border-color: rgba(255, 107, 53, 0.35) !important;
                    box-shadow: 0 0 20px rgba(124, 58, 237, 0.25) !important;
                    color: #ffffff !important;
                }

                /* Glass cards override */
                .glass-card {
                    background: rgba(20, 20, 20, 0.45) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
                    border-radius: 12px !important;
                }

                /* Form fields overrides */
                input, select, textarea {
                    background: rgba(10, 10, 10, 0.6) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 8px !important;
                    color: #ffffff !important;
                    padding: 10px 14px !important;
                    font-family: var(--font-inter), sans-serif !important;
                    font-size: 0.85rem !important;
                    outline: none !important;
                    transition: all 0.2s ease !important;
                }

                input:focus, select:focus, textarea:focus {
                    border-color: var(--accent-orange) !important;
                    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.15) !important;
                }

                /* Tables overrides */
                table {
                    border-collapse: collapse !important;
                }
                table th {
                    background: rgba(255, 255, 255, 0.02) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                    color: var(--text-secondary) !important;
                    font-weight: 700 !important;
                    font-size: 0.72rem !important;
                    letter-spacing: 0.08em !important;
                    text-transform: uppercase !important;
                    padding: 14px 20px !important;
                    font-family: var(--font-inter), sans-serif !important;
                }
                table td {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
                    color: var(--text-secondary) !important;
                    padding: 14px 20px !important;
                    font-size: 0.85rem !important;
                }
                table tr:hover td {
                    background: rgba(255, 255, 255, 0.02) !important;
                }

                /* Primary/Accent Action Buttons overrides */
                button[type="submit"], 
                .bg-cyan-600, 
                .bg-gradient-to-r.from-cyan-600 {
                    background: linear-gradient(90deg, var(--accent-orange) 0%, var(--accent-purple) 100%) !important;
                    border: none !important;
                    color: #ffffff !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    font-size: 0.8rem !important;
                    letter-spacing: 0.06em !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.18) !important;
                    transition: all 0.2s ease !important;
                }

                button[type="submit"]:hover,
                .bg-cyan-600:hover {
                    opacity: 0.9 !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.25) !important;
                }

                /* Secondary Button overrides */
                .bg-slate-700,
                .bg-slate-600 {
                    background: rgba(255, 255, 255, 0.04) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    color: var(--text-primary) !important;
                    border-radius: 8px !important;
                    transition: all 0.2s ease !important;
                }
                .bg-slate-700:hover,
                .bg-slate-600:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                }

                /* Delete / Reject Red Buttons overrides */
                .bg-red-600 {
                    background: rgba(239, 68, 68, 0.1) !important;
                    border: 1px solid rgba(239, 68, 68, 0.25) !important;
                    color: #ef4444 !important;
                    border-radius: 6px !important;
                    transition: all 0.2s ease !important;
                    font-weight: 600 !important;
                }
                .bg-red-600:hover {
                    background: rgba(239, 68, 68, 0.2) !important;
                }

                /* Accept Green Buttons overrides */
                .bg-green-600 {
                    background: rgba(34, 197, 94, 0.1) !important;
                    border: 1px solid rgba(34, 197, 94, 0.25) !important;
                    color: #22c55e !important;
                    border-radius: 6px !important;
                    transition: all 0.2s ease !important;
                    font-weight: 600 !important;
                }
                .bg-green-600:hover {
                    background: rgba(34, 197, 94, 0.2) !important;
                }

                /* Member ID / badges overrides */
                .text-cyan-600 {
                    color: var(--accent-orange) !important;
                    font-weight: 600 !important;
                }
                .text-cyan-500 {
                    color: var(--accent-orange) !important;
                }
                .bg-cyan-950 {
                    background: rgba(255, 107, 53, 0.1) !important;
                    border: 1px solid rgba(255, 107, 53, 0.18) !important;
                }
                .text-cyan-300 {
                    color: #a78bfa !important;
                }
                .border-cyan-500\/30 {
                    border-color: rgba(167, 139, 250, 0.22) !important;
                }

                /* Escaped tailwind slash styles for table inline action buttons */
                .bg-cyan-600\/20 {
                    background: rgba(167, 139, 250, 0.08) !important;
                    color: #a78bfa !important;
                    transition: all 0.2s ease !important;
                }
                .border-cyan-600\/50 {
                    border-color: rgba(167, 139, 250, 0.25) !important;
                }
                .hover\:bg-cyan-600:hover {
                    background: var(--accent-purple) !important;
                    color: #ffffff !important;
                }

                .bg-red-600\/20 {
                    background: rgba(239, 68, 68, 0.08) !important;
                    color: #f87171 !important;
                    transition: all 0.2s ease !important;
                }
                .border-red-600\/50 {
                    border-color: rgba(239, 68, 68, 0.25) !important;
                }
                .hover\:bg-red-600:hover {
                    background: #ef4444 !important;
                    color: #ffffff !important;
                }
            `}</style>
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6 pt-16">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-cyan-400" title="Back to Home">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold font-inter text-cyan-400">ADMIN DASHBOARD</h1>
                    </div>
                    <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 font-mono">
                        <span>ROLE: {userRole?.toUpperCase()}</span>
                        <button 
                            onClick={() => router.push('/member')} 
                            className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white text-xs rounded border border-cyan-600/50 transition-all font-bold font-inter"
                        >
                            MEMBER PORTAL
                        </button>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 md:gap-4 mb-8">
                    {allowedTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 md:px-6 py-2 rounded-lg font-inter font-bold text-xs md:text-sm transition-all ${activeTab === tab.id
                                ? "tab-button-active"
                                : "glass-card text-slate-400 hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="transition-all animate-fade-in">
                    {activeTab === "applicants" && allowedTabs.some(t => t.id === "applicants") && <ApplicantsTab />}
                    {activeTab === "team" && allowedTabs.some(t => t.id === "team") && <TeamTab />}
                    {activeTab === "events" && allowedTabs.some(t => t.id === "events") && <EventsTab />}
                    {activeTab === "inventory" && allowedTabs.some(t => t.id === "inventory") && <InventoryTab />}
                    {activeTab === "allocations" && allowedTabs.some(t => t.id === "allocations") && <AllocationsTab />}
                    {activeTab === "meetings" && allowedTabs.some(t => t.id === "meetings") && <MeetingsTab />}
                    {activeTab === "settings" && allowedTabs.some(t => t.id === "settings") && <SettingsTab />}
                </div>
            </div>
        </div>
    );
}
