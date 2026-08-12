"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { showAlert, showConfirm } from "@/lib/alert-store";
import QRScannerModal from "./QRScannerModal";
import AttendanceMatrixTable from "./AttendanceMatrixTable";
import { exportAttendanceExcel } from "@/lib/exportAttendanceExcel";

export default function EventAttendanceManager({ event, onBack }) {
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Sub-Tab: "feed" | "matrix" | "checkpoints"
  const [activeSubTab, setActiveSubTab] = useState("feed");

  // Scanner Modal state
  const [showScanner, setShowScanner] = useState(false);

  // New Checkpoint Form state
  const [newCpName, setNewCpName] = useState("");
  const [creatingCp, setCreatingCp] = useState(false);

  // Search & Filter for Live Feed
  const [feedSearch, setFeedSearch] = useState("");

  useEffect(() => {
    if (event?.id) {
      loadAttendanceData();
    }
  }, [event?.id]);

  const loadAttendanceData = async () => {
    if (!event?.id) return;
    setLoading(true);
    try {
      // 1. Load Checkpoints for Event
      const { data: cpData, error: cpErr } = await supabase
        .from("event_checkpoints")
        .select("*")
        .eq("event_id", event.id)
        .order("checkpoint_order", { ascending: true });

      if (cpErr) throw cpErr;

      // Default seed checkpoint if none exist
      let cpList = cpData || [];
      if (cpList.length === 0) {
        const { data: newCp, error: seedErr } = await supabase
          .from("event_checkpoints")
          .insert([
            { event_id: event.id, checkpoint_name: "Checkpoint 1", checkpoint_order: 1, is_active: true }
          ])
          .select()
          .single();

        if (!seedErr && newCp) {
          cpList = [newCp];
        }
      }

      setCheckpoints(cpList);
      if (cpList.length > 0 && !selectedCheckpointId) {
        setSelectedCheckpointId(cpList[0].id);
      }

      // 2. Load Attendance Records for Event
      const { data: attData, error: attErr } = await supabase
        .from("event_attendance")
        .select(`
          id,
          event_id,
          checkpoint_id,
          member_id,
          scanned_by,
          scanned_at,
          users ( uid, name, "memberId", roll_number, "photoURL" ),
          event_checkpoints ( id, checkpoint_name )
        `)
        .eq("event_id", event.id)
        .order("scanned_at", { ascending: false });

      if (!attErr) {
        setAttendanceRecords(attData || []);
      }

      // 3. Load All Active Members for Matrix View
      const { data: memberData, error: memErr } = await supabase
        .from("users")
        .select('uid, name, "memberId", roll_number, email, status')
        .eq("status", "accepted");

      if (!memErr) {
        setMembers(memberData || []);
      }
    } catch (err) {
      console.error("[EventAttendanceManager] Error loading data:", err);
      const msg = err?.message || String(err);
      if (msg.includes("schema cache") || msg.includes("event_checkpoints") || msg.includes("event_attendance")) {
        await showAlert(
          "The attendance tables have not been created in your Supabase database yet. Please run the migration SQL script (sql/01_profile_attendance_schema.sql) in the Supabase SQL Editor, then run: NOTIFY pgrst, 'reload schema';",
          "Database Setup Required"
        );
      } else {
        await showAlert("Failed to load attendance data: " + msg, "Load Error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Currently Selected Checkpoint Object
  const currentCheckpoint = useMemo(() => {
    return checkpoints.find((c) => c.id === selectedCheckpointId) || checkpoints[0];
  }, [checkpoints, selectedCheckpointId]);

  // Live Scanned Feed filtered by selected checkpoint
  const liveScannedFeed = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const matchCp = !selectedCheckpointId || rec.checkpoint_id === selectedCheckpointId;
      const memberObj = rec.users || {};
      const matchSearch =
        !feedSearch.trim() ||
        memberObj.name?.toLowerCase().includes(feedSearch.toLowerCase()) ||
        memberObj.memberId?.toLowerCase().includes(feedSearch.toLowerCase()) ||
        memberObj.roll_number?.toLowerCase().includes(feedSearch.toLowerCase());

      return matchCp && matchSearch;
    });
  }, [attendanceRecords, selectedCheckpointId, feedSearch]);

  const handleCreateCheckpoint = async (e) => {
    e.preventDefault();
    if (!newCpName.trim()) return;

    setCreatingCp(true);
    try {
      const nextOrder = checkpoints.length + 1;
      const { data, error } = await supabase
        .from("event_checkpoints")
        .insert([
          {
            event_id: event.id,
            checkpoint_name: newCpName.trim(),
            checkpoint_order: nextOrder,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const updatedCps = [...checkpoints, data];
      setCheckpoints(updatedCps);
      setSelectedCheckpointId(data.id);
      setNewCpName("");
      await showAlert(`Checkpoint "${data.checkpoint_name}" created successfully!`, "Success");
    } catch (err) {
      console.error("[EventAttendanceManager] Create CP error:", err);
      await showAlert("Failed to create checkpoint: " + err.message, "Error");
    } finally {
      setCreatingCp(false);
    }
  };

  const handleToggleCheckpointActive = async (cpId, currentActiveState) => {
    try {
      const { error } = await supabase
        .from("event_checkpoints")
        .update({ is_active: !currentActiveState })
        .eq("id", cpId);

      if (error) throw error;

      setCheckpoints((prev) =>
        prev.map((c) => (c.id === cpId ? { ...c, is_active: !currentActiveState } : c))
      );
    } catch (err) {
      await showAlert("Failed to update checkpoint state: " + err.message, "Error");
    }
  };

  const handleDeleteCheckpointSafely = async (cpId, cpName) => {
    // Safety check: verify if attendance records exist for this checkpoint
    const recordsExist = attendanceRecords.some((r) => r.checkpoint_id === cpId);

    if (recordsExist) {
      const confirmArchive = await showConfirm(
        `Checkpoint "${cpName}" contains historical attendance records. To preserve audit history, this checkpoint will be Archived (Deactivated) instead of deleted. Proceed?`,
        "Archive Checkpoint"
      );
      if (confirmArchive) {
        await handleToggleCheckpointActive(cpId, true);
      }
      return;
    }

    const confirmDelete = await showConfirm(
      `Are you sure you want to permanently delete checkpoint "${cpName}"?`,
      "Delete Checkpoint"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("event_checkpoints").delete().eq("id", cpId);
      if (error) throw error;

      const updated = checkpoints.filter((c) => c.id !== cpId);
      setCheckpoints(updated);
      if (selectedCheckpointId === cpId && updated.length > 0) {
        setSelectedCheckpointId(updated[0].id);
      }
      await showAlert("Checkpoint deleted successfully.", "Deleted");
    } catch (err) {
      await showAlert("Failed to delete checkpoint: " + err.message, "Error");
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportAttendanceExcel({
        event,
        checkpoints,
        members,
        attendanceRecords,
      });
    } catch (err) {
      console.error("[EventAttendanceManager] Export error:", err);
      await showAlert("Failed to export Excel file: " + err.message, "Export Error");
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Header Toolbar */}
      <div className="bg-[#111115] border border-white/[0.06] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-xs text-cyan-400 hover:underline font-mono mb-1 inline-block"
          >
            ← Back to Events List
          </button>
          <h2 className="text-xl font-extrabold font-orbitron text-white tracking-wide">
            {event.title}
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Date: {event.date || "TBD"} • Total Scans Recorded: <strong className="text-cyan-400">{attendanceRecords.length}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-orbitron font-bold transition-all flex items-center gap-2"
          >
            <span>📊</span> EXPORT ATTENDANCE (.XLSX)
          </button>

          <button
            onClick={() => setShowScanner(true)}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 rounded-xl text-xs font-orbitron font-bold tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <span>📷</span> OPEN QR SCANNER
          </button>
        </div>
      </div>

      {/* Checkpoint Selection Bar */}
      <div className="bg-[#111115] border border-white/[0.06] p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-xs font-mono text-gray-400 uppercase shrink-0 font-bold">
            Active Checkpoint:
          </label>
          <select
            value={selectedCheckpointId}
            onChange={(e) => setSelectedCheckpointId(e.target.value)}
            className="bg-black/60 border border-white/10 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 flex-1 max-w-xs"
          >
            {checkpoints.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.checkpoint_name} {!cp.is_active ? "(Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Add Checkpoint Form */}
        <form onSubmit={handleCreateCheckpoint} className="flex items-center gap-2">
          <input
            type="text"
            required
            value={newCpName}
            onChange={(e) => setNewCpName(e.target.value)}
            placeholder="New Checkpoint Name..."
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={creatingCp || !newCpName.trim()}
            className="px-3.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/60 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-orbitron font-bold transition-all disabled:opacity-50"
          >
            {creatingCp ? "Adding..." : "+ Add"}
          </button>
        </form>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-white/[0.06] pb-px text-xs font-orbitron">
        <button
          onClick={() => setActiveSubTab("feed")}
          className={`pb-3 font-bold tracking-wider relative transition-colors ${
            activeSubTab === "feed"
              ? "text-cyan-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          LIVE SCANNED FEED ({liveScannedFeed.length})
          {activeSubTab === "feed" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("matrix")}
          className={`pb-3 font-bold tracking-wider relative transition-colors ${
            activeSubTab === "matrix"
              ? "text-cyan-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ATTENDANCE MATRIX ({members.length} Members)
          {activeSubTab === "matrix" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("checkpoints")}
          className={`pb-3 font-bold tracking-wider relative transition-colors ${
            activeSubTab === "checkpoints"
              ? "text-cyan-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          MANAGE CHECKPOINTS ({checkpoints.length})
          {activeSubTab === "checkpoints" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>
      </div>

      {/* VIEW 1: LIVE SCANNED FEED */}
      {activeSubTab === "feed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="Search feed by member name, RC ID, or roll number..."
              className="w-full max-w-md bg-black/50 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs font-mono text-gray-400">
              Showing Scans for: <strong className="text-cyan-400">{currentCheckpoint?.checkpoint_name || "Checkpoint"}</strong>
            </span>
          </div>

          <div className="bg-[#111115] border border-white/[0.06] rounded-xl overflow-hidden shadow-lg">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-500 font-mono animate-pulse">
                Loading attendance scan feed...
              </div>
            ) : liveScannedFeed.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 font-mono italic">
                No attendance scans recorded for this checkpoint yet. Click &quot;OPEN QR SCANNER&quot; above to scan member credentials.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {liveScannedFeed.map((rec) => {
                  const memberObj = rec.users || {};
                  const scanTimeStr = rec.scanned_at
                    ? new Date(rec.scanned_at).toLocaleString()
                    : "—";

                  return (
                    <div
                      key={rec.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 flex items-center justify-center font-orbitron font-bold text-cyan-400 text-sm">
                          {memberObj.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={memberObj.photoURL} alt={memberObj.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{memberObj.name?.charAt(0) || "M"}</span>
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-bold text-white text-sm font-inter truncate">
                            {memberObj.name || "Member"}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-mono text-gray-400 flex-wrap">
                            <span className="text-cyan-400 font-semibold">{memberObj.memberId || "RC-MEMBER"}</span>
                            <span>•</span>
                            <span className="text-purple-400 font-semibold">{memberObj.roll_number || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono text-xs space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          ✓ RECORDED
                        </span>
                        <p className="text-[10px] text-gray-500">{scanTimeStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DYNAMIC ATTENDANCE MATRIX */}
      {activeSubTab === "matrix" && (
        <AttendanceMatrixTable
          checkpoints={checkpoints}
          members={members}
          attendanceRecords={attendanceRecords}
        />
      )}

      {/* VIEW 3: MANAGE CHECKPOINTS */}
      {activeSubTab === "checkpoints" && (
        <div className="bg-[#111115] border border-white/[0.06] rounded-xl overflow-hidden p-6 space-y-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <h3 className="font-orbitron font-bold text-sm text-cyan-400 uppercase tracking-wider">
              Configured Checkpoints List ({checkpoints.length})
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Checkpoints with recorded attendance are protected from destructive deletion and will be Archived.
            </p>
          </div>

          <div className="space-y-3">
            {checkpoints.map((cp) => {
              const scanCount = attendanceRecords.filter((r) => r.checkpoint_id === cp.id).length;

              return (
                <div
                  key={cp.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                      {cp.checkpoint_order || 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm font-inter">
                        {cp.checkpoint_name}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        Scans Recorded: <strong className="text-cyan-400">{scanCount}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCheckpointActive(cp.id, cp.is_active)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-orbitron font-bold border transition-all ${
                        cp.is_active
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {cp.is_active ? "ACTIVE" : "INACTIVE / ARCHIVED"}
                    </button>

                    <button
                      onClick={() => handleDeleteCheckpointSafely(cp.id, cp.checkpoint_name)}
                      className="px-3 py-1 bg-red-950/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-[10px] font-orbitron font-bold rounded transition-colors"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTINUOUS CAMERA QR SCANNER MODAL */}
      {showScanner && currentCheckpoint && (
        <QRScannerModal
          event={event}
          checkpoint={currentCheckpoint}
          onClose={() => setShowScanner(false)}
          onScanComplete={() => {
            // Refetch live attendance records in background
            loadAttendanceData();
          }}
        />
      )}
    </div>
  );
}
