"use client";

import React, { useState, useEffect } from "react";
import { fetchEvents } from "@/lib/firebase/dashboardService";
import { formatDate } from "@/utils/formatters";

export default function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadEvents() {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error("Error loading events:", err);
      setError("Failed to fetch events from Firestore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEvents();
  }, []);;

  return (
    <div className="space-y-6 font-inter">
      {/* Table grid layout for events */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-white/[0.04] bg-black/30 flex justify-between items-center">
          <h2 className="font-orbitron text-sm font-bold text-gray-400 tracking-wider">
            REGISTERED SYSTEM EVENTS
          </h2>
          <span className="text-xs bg-cyan-950/20 text-cyan-400 border border-cyan-800/30 px-2.5 py-1 rounded font-mono">
            COUNT: {events.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-mono text-sm">
            &gt; Syncing event log registers...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 font-mono text-sm">
            &gt; ERROR: {error}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic text-sm">
            No events found in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {events.map((event) => {
              const formattedDate = event.comingSoon
                ? "COMING SOON"
                : event.date
                ? formatDate(event.date)
                : "Date TBD";
              
              return (
                <div
                  key={event.id}
                  className="bg-black/40 border border-white/[0.04] rounded-lg overflow-hidden flex flex-col hover:border-cyan-500/20 transition-all shadow-md group hover:shadow-[0_0_20px_rgba(8,145,178,0.05)]"
                >
                  {/* Event Thumbnail */}
                  <div className="h-40 relative bg-slate-900 overflow-hidden shrink-0">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.parentNode.innerHTML = `
                            <div class="w-full h-full flex flex-col items-center justify-center text-cyan-500/40 p-4">
                              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <span class="text-[9px] font-mono mt-2">IMAGE UNREACHABLE</span>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-cyan-500/40 p-4">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-[9px] font-mono mt-2">NO EVENT IMAGE</span>
                      </div>
                    )}
                    
                    {/* Coming soon indicator */}
                    {event.comingSoon && (
                      <div className="absolute top-3 right-3 bg-purple-500 text-white font-orbitron font-bold text-[9px] px-2 py-0.5 rounded tracking-widest uppercase shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                        Coming Soon
                      </div>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-orbitron font-bold text-white text-sm tracking-wide leading-snug group-hover:text-cyan-400 transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 font-mono">
                        <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formattedDate}</span>
                      </div>

                      <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Action link */}
                    {event.link && (
                      <div className="mt-4 pt-3 border-t border-white/[0.04]">
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-orbitron font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
                        >
                          REGISTRATION LINK
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
