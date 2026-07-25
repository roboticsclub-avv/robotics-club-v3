"use client";

import React from "react";
import CountdownWidget from "@/components/requisition/CountdownWidget";
import { generateRequisitionPDF } from "@/lib/pdf/generateRequisitionPDF";

export default function RequisitionDetailModal({ request, user, onClose, onRequestExtension }) {
  if (!request) return null;

  const isIssued = request.status === "issued";

  const statusColors = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    approved: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    issued: "bg-[var(--accent-purple-glow)] text-[var(--accent-purple)] border-[var(--accent-purple)]/40",
    returned: "bg-gray-500/15 text-gray-300 border-gray-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
    overdue: "bg-red-500/25 text-red-300 border-red-500/40 animate-pulse",
  };

  const handlePDFDownload = async () => {
    try {
      const itemsData = request.hardware_request_items || [
        { hardware_name: request.project_title, qty: 1, category: "General" }
      ];
      await generateRequisitionPDF(request, itemsData);
    } catch (err) {
      alert("Failed to generate PDF: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-inter overflow-y-auto">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative text-[var(--text-primary)] my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl font-bold w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center transition-colors"
          aria-label="Close details"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="border-b border-[var(--border-subtle)] pb-4 space-y-2 pr-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-orbitron font-bold text-sm sm:text-base text-[var(--accent-purple)] tracking-wider">
              {request.final_requisition_id || request.temp_request_id}
            </span>
            <span
              className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                statusColors[request.status] || statusColors.pending
              }`}
            >
              {request.status}
            </span>
          </div>

          <h2 className="font-orbitron font-bold text-xl sm:text-2xl text-[var(--text-primary)] tracking-wide">
            {request.project_title}
          </h2>

          {isIssued && (
            <div className="pt-2">
              <CountdownWidget returnDate={request.return_date} takeawayDate={request.takeaway_date} status={request.status} />
            </div>
          )}
        </div>

        {/* Timeline & Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs font-mono">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Project Type</span>
            <span className="text-[var(--text-primary)] font-bold">{request.project_type || "N/A"}</span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Takeaway Date</span>
            <span className="text-[var(--text-primary)] font-bold">{request.takeaway_date || "N/A"}</span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Return Date</span>
            <span className="text-[var(--text-primary)] font-bold">{request.return_date || "N/A"}</span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Total Duration</span>
            <span className="text-[var(--accent-orange)] font-bold">{request.total_days || 0} Days</span>
          </div>
        </div>

        {/* Complete Hardware Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-orbitron font-bold text-sm text-[var(--text-primary)] tracking-wider uppercase">
              Requested Equipment & Components ({request.hardware_request_items?.length || 0})
            </h3>
          </div>

          {request.hardware_request_items && request.hardware_request_items.length > 0 ? (
            <div className="border border-[var(--border-card)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-card)] text-[var(--text-muted)] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Component Name</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {request.hardware_request_items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="py-3 px-4 font-semibold">{item.hardware_name}</td>
                      <td className="py-3 px-4 text-center font-bold text-[var(--accent-teal)]">x{item.qty}</td>
                      <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px]">
                          {item.category || "General"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic font-mono">No hardware line items recorded.</p>
          )}
        </div>

        {/* Additional Notes */}
        {request.remarks && (
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block font-semibold">Remarks / Purpose Notes:</span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{request.remarks}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] text-xs font-mono font-bold border border-[var(--border-card)] transition-all"
          >
            Close
          </button>

          <button
            onClick={handlePDFDownload}
            className="px-5 py-2.5 rounded-xl bg-[var(--bg-card-hover)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-mono font-bold border border-[var(--border-card)] transition-all flex items-center gap-2 shadow-sm"
          >
            <span>📄</span> Download Official PDF
          </button>

          {isIssued && onRequestExtension && (
            <button
              onClick={() => {
                onClose();
                onRequestExtension(request);
              }}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-orbitron font-bold text-xs tracking-wider transition-all shadow-lg shadow-[var(--accent-purple-glow)]"
            >
              Request Extension
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
