"use client";

import React, { useState, useMemo } from "react";

export default function AttendanceMatrixTable({ checkpoints = [], members = [], attendanceRecords = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const sortedCheckpoints = useMemo(() => {
    return [...checkpoints].sort((a, b) => (a.checkpoint_order || 0) - (b.checkpoint_order || 0));
  }, [checkpoints]);

  // Build matrix data lookup
  const matrixData = useMemo(() => {
    // Group scan records by member_id
    const scanMap = {};
    attendanceRecords.forEach((rec) => {
      if (!scanMap[rec.member_id]) {
        scanMap[rec.member_id] = {};
      }
      scanMap[rec.member_id][rec.checkpoint_id] = rec.scanned_at ? new Date(rec.scanned_at) : true;
    });

    // Generate list of members to display
    const list = members.length > 0
      ? members
      : Object.keys(scanMap).map((mId) => {
          const rec = attendanceRecords.find((r) => r.member_id === mId);
          return {
            uid: mId,
            name: rec?.users?.name || "Member",
            memberId: rec?.users?.memberId || "RC-MEMBER",
            roll_number: rec?.users?.roll_number || "N/A",
          };
        });

    return list.map((m) => {
      const memberScans = scanMap[m.uid] || {};
      let attendedCount = 0;

      const checkpointStatuses = sortedCheckpoints.map((cp) => {
        const scanVal = memberScans[cp.id];
        if (scanVal) {
          attendedCount++;
          return {
            attended: true,
            timeStr: scanVal instanceof Date
              ? scanVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "Attended",
          };
        }
        return { attended: false, timeStr: "—" };
      });

      const totalCp = sortedCheckpoints.length || 1;
      const percentage = Math.round((attendedCount / totalCp) * 100);

      const getRollNumber = () => {
        if (m.roll_number) return m.roll_number;
        if (m.email && m.email.toLowerCase().startsWith("av.")) {
          return m.email.split("@")[0].toUpperCase();
        }
        return "N/A";
      };

      return {
        uid: m.uid,
        name: m.name || "Member",
        memberId: m.memberId || m.member_id || "N/A",
        rollNumber: getRollNumber(),
        checkpointStatuses,
        attendedCount,
        percentage,
      };
    });
  }, [members, checkpoints, attendanceRecords, sortedCheckpoints]);

  // Filter matrix by search term
  const filteredMatrix = useMemo(() => {
    if (!searchTerm.trim()) return matrixData;
    const term = searchTerm.toLowerCase();
    return matrixData.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.memberId.toLowerCase().includes(term) ||
        m.rollNumber.toLowerCase().includes(term)
    );
  }, [matrixData, searchTerm]);

  return (
    <div className="space-y-4 font-inter">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search matrix by name, RC ID, or roll number..."
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-gray-400">
          Total Members: <strong className="text-cyan-400 font-bold">{filteredMatrix.length}</strong>
        </div>
      </div>

      {/* Dynamic Matrix Table */}
      <div className="bg-[#111115] border border-white/[0.06] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">S.No.</th>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">RC Member ID</th>
                <th className="py-3.5 px-4">Roll Number</th>
                {sortedCheckpoints.map((cp, idx) => (
                  <th key={cp.id || idx} className="py-3.5 px-4 text-center whitespace-nowrap">
                    {cp.checkpoint_name}
                  </th>
                ))}
                <th className="py-3.5 px-4 text-center">Attended</th>
                <th className="py-3.5 px-4 text-center">% Attended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + sortedCheckpoints.length}
                    className="py-12 text-center text-gray-500 italic text-xs"
                  >
                    No attendance matrix data available.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row, idx) => (
                  <tr key={row.uid || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white font-inter">{row.name}</td>
                    <td className="py-3 px-4 text-cyan-400 font-semibold">{row.memberId}</td>
                    <td className="py-3 px-4 text-purple-400 font-semibold">{row.rollNumber}</td>
                    
                    {/* Dynamic Checkpoint Status Cells */}
                    {row.checkpointStatuses.map((cpStatus, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-center">
                        {cpStatus.attended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <span>✓</span> {cpStatus.timeStr}
                          </span>
                        ) : (
                          <span className="text-gray-600 font-mono">—</span>
                        )}
                      </td>
                    ))}

                    <td className="py-3 px-4 text-center font-bold text-white">
                      {row.attendedCount} / {sortedCheckpoints.length}
                    </td>

                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          row.percentage >= 80
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : row.percentage >= 50
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
