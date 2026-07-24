"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";

function EventDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("No event ID provided.");
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Event not found.");
        } else {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatEventDate = (dateString, comingSoon) => {
    if (comingSoon || !dateString) return "Coming Soon";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date TBD";
      return date.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Date TBD";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400 font-mono text-sm animate-pulse">&gt; Loading event data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold font-orbitron text-white mb-2">Event Not Found</h1>
        <p className="text-gray-400 font-mono text-sm mb-8">{error}</p>
        <Link
          href="/#events"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-lg tracking-wider transition-colors"
        >
          ← BACK TO EVENTS
        </Link>
      </div>
    );
  }

  const formattedDate = formatEventDate(event.date, event.comingSoon);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Hero Banner */}
      <div className="relative w-full h-[50vh] min-h-[320px] bg-[#111115] overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/30 to-cyan-950/20">
            <svg className="w-24 h-24 text-cyan-500/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/#events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-orbitron font-bold rounded-lg hover:bg-white/10 transition-colors"
          >
            ← EVENTS
          </Link>
        </div>

        {/* Coming Soon badge */}
        {event.comingSoon && (
          <div className="absolute top-6 right-6 z-10">
            <span className="px-3 py-1.5 bg-purple-500 text-white font-orbitron font-bold text-[10px] rounded tracking-widest uppercase shadow-[0_0_20px_rgba(124,58,237,0.5)]">
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20 -mt-16 relative z-10">

        {/* Title Card */}
        <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-8 mb-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <h1 className="text-2xl sm:text-3xl font-orbitron font-bold text-white leading-tight mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Date */}
            <div className="flex items-center gap-2 text-cyan-400 font-mono">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={event.comingSoon ? "text-purple-400 font-bold" : ""}>{formattedDate}</span>
            </div>

            {/* Status dot */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              event.comingSoon
                ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${event.comingSoon ? "bg-purple-400" : "bg-emerald-400 animate-pulse"}`} />
              {event.comingSoon ? "Upcoming" : "Active"}
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-8 mb-6">
          <h2 className="text-xs font-orbitron font-bold text-cyan-400 tracking-widest uppercase mb-4">About This Event</h2>
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line font-inter">
            {event.description || "No description available for this event."}
          </p>
        </div>

        {/* Registration CTA */}
        <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xs font-orbitron font-bold text-gray-400 tracking-widest uppercase mb-1">Registration</h2>
            {event.comingSoon ? (
              <p className="text-gray-500 text-sm font-inter">Registration opens when the event is announced.</p>
            ) : event.link ? (
              <p className="text-gray-400 text-sm font-inter">Register now to secure your spot.</p>
            ) : (
              <p className="text-gray-500 text-sm font-inter">No registration link available yet.</p>
            )}
          </div>

          {event.link && !event.comingSoon ? (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]"
            >
              REGISTER NOW
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <button
              disabled
              className="shrink-0 px-6 py-3 bg-white/[0.04] border border-white/[0.06] text-gray-600 font-orbitron font-bold text-xs rounded-xl tracking-wider cursor-not-allowed"
            >
              {event.comingSoon ? "COMING SOON" : "NO LINK"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default function EventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <EventDetailContent />
    </Suspense>
  );
}
