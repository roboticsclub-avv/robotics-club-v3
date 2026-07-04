"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function EventDetailContent() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('id');

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEventDetails = async () => {
            if (!eventId) {
                setLoading(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (error) throw error;
                setEvent(data);
            } catch (err) {
                console.error("Error fetching event details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center pt-24 min-h-screen">
                <div className="text-cyan-400 font-orbitron animate-pulse text-xl">LOADING EVENT...</div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center gap-4 text-center px-4 pt-24 min-h-screen">
                <h1 className="text-3xl font-bold text-white font-orbitron">Event Not Found</h1>
                <p className="text-slate-400">The event you are looking for does not exist or has been removed.</p>
                <Link href="/" className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors font-bold mt-4">
                    RETURN HOME
                </Link>
            </div>
        );
    }

    const formatDate = (dateString, isComingSoon) => {
        if (isComingSoon || !dateString) return "TBA - Coming Soon";
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <div className="w-full max-w-4xl pt-32 pb-24 mx-auto px-4 z-10 flex flex-col items-center">
            {/* Back Button */}
            <div className="w-full mb-6">
                <Link href="/#events" className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 text-sm font-bold tracking-wider">
                    ← BACK TO EVENTS
                </Link>
            </div>

            <article className="w-full glass-card border border-slate-700/50 bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                {/* Event Banner */}
                {event.image ? (
                    <div className="w-full h-64 md:h-96 relative bg-slate-800">
                        <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    </div>
                ) : (
                    <div className="w-full h-32 md:h-48 bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border-b border-slate-800"></div>
                )}

                {/* Content Section */}
                <div className="px-6 py-10 md:px-12 md:py-12 relative">
                    {/* Title Header */}
                    <div className="mb-8 border-b border-slate-700/50 pb-8">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${event.comingSoon ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                                {event.comingSoon ? 'UPCOMING EVENT' : 'ACTIVE EVENT'}
                            </span>
                            <span className="text-slate-400 text-sm font-medium flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(event.date, event.comingSoon)}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-6 leading-tight">
                            {event.title}
                        </h1>

                        {/* Call to Action Row */}
                        <div className="flex flex-wrap gap-4 items-center">
                            <a
                                href={event.link || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`px-8 py-3 rounded text-sm font-bold font-orbitron tracking-wider shadow-lg transition-transform hover:-translate-y-1 inline-block ${event.comingSoon ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-purple-900/50 hover:shadow-cyan-900/50'} `}
                                onClick={(e) => { if (event.comingSoon) e.preventDefault(); }}
                            >
                                {event.comingSoon ? "REGISTRATION TBA" : "REGISTER NOW"}
                            </a>
                        </div>
                    </div>

                    {/* Description Body */}
                    <div className="prose prose-invert prose-slate max-w-none prose-lg">
                        <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </div>
                    </div>

                    {/* Custom Content for TechTorque */}
                    {event.title?.toLowerCase().includes('techtorque') && (
                        <div className="mt-12 space-y-8 border-t border-slate-700/50 pt-10">
                            <div>
                                <h3 className="text-2xl font-bold font-orbitron text-cyan-400 mb-4 flex items-center gap-3">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    EVENT FLOW
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-colors">
                                        <div className="inline-block px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs font-bold font-mono text-cyan-400 mb-3">PHASE 01 // MORNING</div>
                                        <h4 className="text-lg font-bold text-white mb-2 font-orbitron">Robothon Simulation</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed">Put your logic and control systems to the test in our advanced simulation environment. Design, code, and optimize your robotic solutions virtually before hitting the physical track.</p>
                                    </div>
                                    <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-orange-500/50 transition-colors">
                                        <div className="inline-block px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs font-bold font-mono text-orange-400 mb-3">PHASE 02 // AFTERNOON</div>
                                        <h4 className="text-lg font-bold text-white mb-2 font-orbitron">RC Car Racing Showdown</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed">Bring your custom-built remote-controlled creations to life in a high-intensity head-to-head racing showdown. Speed, mechanical design, and driving skill will determine the victor.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold font-orbitron text-purple-400 mb-4 flex items-center gap-3">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    AWARDS & PRIZES
                                </h3>
                                <div className="bg-gradient-to-r from-purple-900/10 to-cyan-900/10 p-6 rounded-xl border border-purple-500/20">
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center flex-shrink-0 text-yellow-400 font-bold">1</div>
                                            <div>
                                                <strong className="text-white block">Grand Champion</strong>
                                                <span className="text-sm text-slate-400">Exclusive TechTorque 2026 Trophy + Cash Prize + Merchandise Kit</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/50 flex items-center justify-center flex-shrink-0 text-slate-300 font-bold">2</div>
                                            <div>
                                                <strong className="text-white block">Runner Up</strong>
                                                <span className="text-sm text-slate-400">Silver Medal + Cash Prize + Swag Bag</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">★</div>
                                            <div>
                                                <strong className="text-white block">Design Innovation Award</strong>
                                                <span className="text-sm text-slate-400">Special recognition for the most unique chassis and control implementation.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}

export default function EventPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background elements to match the site theme */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px]" />
            </div>

            <Suspense fallback={
                <div className="flex-grow flex items-center justify-center pt-24 min-h-screen z-10 relative">
                    <div className="text-cyan-400 font-orbitron animate-pulse text-xl">LOADING EVENT...</div>
                </div>
            }>
                <EventDetailContent />
            </Suspense>
        </main>
    );
}
