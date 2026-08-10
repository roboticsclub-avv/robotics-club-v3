"use client";

import React, { useState } from "react";
import { formatDate } from "@/utils/formatters";
import CountdownWidget from "@/components/requisition/CountdownWidget";
import { supabase } from "@/lib/supabase";

export default function ProfileHardwareSection({ allocations = [], onRefresh }) {
  const [extendingId, setExtendingId] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [actionMsg, setActionMsg] = useState("");

  const activeAllocations = allocations.filter((a) => a.status !== "returned");

  const handleExtendHardware = async (allocationId, currentExpectedReturn) => {
    try {
      setExtendingId(allocationId);
      setActionMsg("");

      const baseDate = currentExpectedReturn ? new Date(currentExpectedReturn) : new Date();
      baseDate.setDate(baseDate.getDate() + parseInt(extendDays || 7, 10));
      const newReturnStr = baseDate.toISOString().split("T")[0];

      const { error } = await supabase
        .from("allocations")
        .update({
          expectedReturn: newReturnStr,
          status: "extended"
        })
        .eq("id", allocationId);

      if (error) throw error;

      setActionMsg(`Return date extended to ${formatDate(newReturnStr)}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("[ProfileHardwareSection] Extension error:", err);
      alert(`Failed to extend return date: ${err.message || err}`);
    } finally {
      setExtendingId(null);
    }
  };

  return (
    <div className="space-y-4 font-inter">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--accent-teal)] flex items-center gap-2">
          <span>🔧</span> MY BORROWED HARDWARE ({activeAllocations.length})
        </h3>
        <button
          onClick={onRefresh}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition font-mono"
        >
          🔄 Refresh
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono text-center">
          {actionMsg}
        </div>
      )}

      {activeAllocations.length === 0 ? (
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-center text-xs text-[var(--text-muted)] font-mono">
          No hardware components currently issued to your account.
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          {activeAllocations.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-3 hover:border-[var(--accent-teal)]/40 transition-all shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[var(--text-primary)] text-sm font-orbitron">
                    {item.itemName || item.item_name || "Hardware Component"}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                    Issued: {formatDate(item.issuedAt || item.issued_at)}
                  </p>
                </div>

                <CountdownWidget
                  returnDate={item.expectedReturn || item.expected_return}
                  status={item.status}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-xs font-mono">
                <span className="text-[var(--text-secondary)]">
                  Return Target: <strong className="text-[var(--text-primary)]">{formatDate(item.expectedReturn || item.expected_return)}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none"
                  >
                    <option value="3">+3 Days</option>
                    <option value="7">+7 Days</option>
                    <option value="14">+14 Days</option>
                  </select>

                  <button
                    onClick={() => handleExtendHardware(item.id, item.expectedReturn || item.expected_return)}
                    disabled={extendingId === item.id}
                    className="px-3 py-1 bg-[var(--accent-teal)] hover:brightness-110 text-[var(--bg-primary)] rounded-lg text-xs font-orbitron font-bold transition-all disabled:opacity-50"
                  >
                    {extendingId === item.id ? "Extending..." : "Request Extension"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
