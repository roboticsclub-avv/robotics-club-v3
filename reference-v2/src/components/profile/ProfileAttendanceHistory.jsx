"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/utils/formatters";

export default function ProfileAttendanceHistory({ userId }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserAttendance();
    }
  }, [userId]);

  const fetchUserAttendance = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Query user's attendance joined with event and checkpoint details
      const { data, error } = await supabase
        .from("event_attendance")
        .select(`
          id,
          scanned_at,
          events ( id, title, date ),
          event_checkpoints ( id, checkpoint_name )
        `)
        .eq("member_id", userId)
        .order("scanned_at", { ascending: false });

      if (!error && data) {
        // Group scans by event
        const grouped = {};
        data.forEach((item) => {
          const eventId = item.events?.id || "unknown";
          if (!grouped[eventId]) {
            grouped[eventId] = {
              eventTitle: item.events?.title || "Robotics Event",
              eventDate: item.events?.date,
              scans: [],
            };
          }
          grouped[eventId].scans.push({
            checkpointName: item.event_checkpoints?.checkpoint_name || "Checkpoint",
            scannedAt: item.scanned_at,
          });
        });

        setAttendanceRecords(Object.values(grouped));
      }
    } catch (err) {
      console.error("[ProfileAttendanceHistory] Error loading history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-inter">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--accent-purple)] flex items-center gap-2">
          <span>📋</span> EVENT ATTENDANCE HISTORY
        </h3>
        <button
          onClick={fetchUserAttendance}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition font-mono"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-[var(--text-muted)] font-mono animate-pulse">
          Loading attendance history...
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-center text-xs text-[var(--text-muted)] font-mono">
          No event attendance scans recorded for your account yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {attendanceRecords.map((evt, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[var(--text-primary)] font-orbitron">
                  {evt.eventTitle}
                </h4>
                <span className="text-[10px] font-mono text-[var(--accent-teal)] font-bold">
                  {evt.scans.length} Checkpoint(s) Attended
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border-subtle)]">
                {evt.scans.map((scan, sIdx) => {
                  const scanTimeStr = scan.scannedAt
                    ? new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "—";

                  return (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-card)] font-mono text-[10px] flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <strong className="text-[var(--text-primary)]">{scan.checkpointName}:</strong>
                      <span>{scanTimeStr}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
