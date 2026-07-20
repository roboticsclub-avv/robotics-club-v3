"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ExtensionRequestModal({ request, user, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [newReturnDate, setNewReturnDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const minDate = request?.return_date || new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("Please provide a reason for the extension.");
      return;
    }
    if (!newReturnDate) {
      setErrorMsg("Please select a new requested return date.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.from("extension_requests").insert({
        request_id: request.id,
        user_id: user.id,
        reason,
        new_requested_date: newReturnDate,
        status: "pending",
      });

      if (error) throw error;

      alert("Extension request submitted successfully! Pending admin approval.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Extension request error:", err);
      setErrorMsg("Failed to submit extension: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-inter">
      <div className="bg-[#111115] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="font-orbitron text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            REQUEST BORROW EXTENSION
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Requisition ID: {request.final_requisition_id || request.temp_request_id}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-medium block mb-1">
              Current Return Date
            </label>
            <input
              type="text"
              readOnly
              value={request.return_date || "N/A"}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-400 font-mono"
            />
          </div>

          <div>
            <label className="text-gray-300 font-medium block mb-1">
              New Requested Return Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              min={minDate}
              value={newReturnDate}
              onChange={(e) => setNewReturnDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-gray-300 font-medium block mb-1">
              Reason for Extension <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain why extra time is required to complete testing or project milestones..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-orbitron transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Extension Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
