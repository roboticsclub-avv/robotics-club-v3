"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { showAlert, showConfirm } from "@/lib/alert-store";

export default function AllocationsTab() {
  const [activeSubTab, setActiveSubTab] = useState("v3_requests"); // "v3_requests" | "extensions" | "manual_issue"
  const [hardwareRequests, setHardwareRequests] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Issue State
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [searchResult, setSearchResult] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Hardware Requests (V3 Requisition System)
      const { data: reqData, error: reqError } = await supabase
        .from("hardware_requests")
        .select("*, hardware_request_items(*)")
        .order("created_at", { ascending: false });

      if (!reqError && reqData) {
        setHardwareRequests(reqData);
      }

      // 2. Fetch Extension Requests
      const { data: extData, error: extError } = await supabase
        .from("extension_requests")
        .select("*, hardware_requests(*)")
        .order("created_at", { ascending: false });

      if (!extError && extData) {
        setExtensionRequests(extData);
      }

      // 3. Fetch Allocations (Legacy system compatibility)
      const { data: allocsData } = await supabase.from("allocations").select("*");
      setAllocations(allocsData || []);

      // 4. Fetch Inventory Hardware
      const { data: hwData } = await supabase.from("hardware").select("*");
      setInventory(hwData || []);
    } catch (error) {
      console.error("Error fetching admin allocations data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Admin Approval Action -> Triggers sequential HR-YY-XXXX ID generation
  const handleApproveRequest = async (request) => {
    const confirmed = await showConfirm(
      `Approve hardware request "${request.temp_request_id}" for ${request.user_name}? This will assign the next sequential Requisition ID.`,
      "Confirm Approval"
    );
    if (!confirmed) return;

    try {
      const { data, error } = await supabase
        .from("hardware_requests")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .select()
        .single();

      if (error) throw error;

      await showAlert(
        `Request Approved! Assigned Requisition ID: ${data.final_requisition_id || "HR-26-0001"}`,
        "Approval Confirmed"
      );
      fetchData();
    } catch (err) {
      console.error("Approval error:", err);
      await showAlert("Failed to approve request: " + err.message, "Error");
    }
  };

  // Admin Mark Issued Action
  const handleIssueRequest = async (request) => {
    const confirmed = await showConfirm(
      `Mark request "${request.final_requisition_id || request.temp_request_id}" as PHYSICALLY ISSUED to member?`,
      "Confirm Physical Issue"
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("hardware_requests")
        .update({
          status: "issued",
          issued_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      await showAlert("Hardware marked as ISSUED successfully.", "Status Updated");
      fetchData();
    } catch (err) {
      console.error("Issue error:", err);
      await showAlert("Failed to mark as issued: " + err.message, "Error");
    }
  };

  // Admin Mark Returned Action
  const handleReturnRequest = async (request) => {
    const confirmed = await showConfirm(
      `Mark hardware for "${request.final_requisition_id || request.temp_request_id}" as RETURNED to lab stock?`,
      "Confirm Return"
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("hardware_requests")
        .update({
          status: "returned",
          returnedAt: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      await showAlert("Hardware marked as RETURNED.", "Return Processed");
      fetchData();
    } catch (err) {
      console.error("Return error:", err);
      await showAlert("Failed to process return: " + err.message, "Error");
    }
  };

  // Admin Reject Action
  const handleRejectRequest = async (request) => {
    const notes = prompt("Provide reason for rejection:");
    if (notes === null) return;

    try {
      const { error } = await supabase
        .from("hardware_requests")
        .update({
          status: "rejected",
          admin_notes: notes,
        })
        .eq("id", request.id);

      if (error) throw error;

      await showAlert("Requisition request REJECTED.", "Request Rejected");
      fetchData();
    } catch (err) {
      console.error("Rejection error:", err);
      await showAlert("Failed to reject request: " + err.message, "Error");
    }
  };

  // Handle Extension Request Review
  const handleReviewExtension = async (ext, newStatus) => {
    try {
      // 1. Update extension request status
      const { error: extErr } = await supabase
        .from("extension_requests")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", ext.id);

      if (extErr) throw extErr;

      // 2. If approved, update return date in hardware_requests
      if (newStatus === "approved") {
        await supabase
          .from("hardware_requests")
          .update({ return_date: ext.new_requested_date })
          .eq("id", ext.request_id);
      }

      await showAlert(`Extension request ${newStatus.toUpperCase()}.`, "Extension Processed");
      fetchData();
    } catch (err) {
      console.error("Extension review error:", err);
      await showAlert("Failed to review extension: " + err.message, "Error");
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h2 className="font-orbitron font-bold text-lg text-white">
            HARDWARE REQUISITIONS & ALLOCATIONS MANAGEMENT
          </h2>
          <p className="text-xs text-gray-400">
            Review member hardware requests, assign sequential IDs (HR-YY-XXXX), and manage borrow extensions.
          </p>
        </div>

        {/* Sub-Tab Selector Buttons */}
        <div className="flex gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab("v3_requests")}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeSubTab === "v3_requests"
                ? "bg-purple-600/20 text-purple-300 border-purple-500/40"
                : "bg-white/[0.02] text-gray-400 border-white/[0.06]"
            }`}
          >
            Requisitions ({hardwareRequests.length})
          </button>
          <button
            onClick={() => setActiveSubTab("extensions")}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeSubTab === "extensions"
                ? "bg-purple-600/20 text-purple-300 border-purple-500/40"
                : "bg-white/[0.02] text-gray-400 border-white/[0.06]"
            }`}
          >
            Extensions ({extensionRequests.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-purple-400 font-mono">
          Loading hardware requisitions...
        </div>
      ) : activeSubTab === "v3_requests" ? (
        /* V3 Requisitions Table */
        <div className="space-y-4">
          {hardwareRequests.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-xs text-gray-500 font-mono">
              No hardware requisitions submitted yet.
            </div>
          ) : (
            hardwareRequests.map((req) => {
              const isPending = req.status === "pending";
              const isApproved = req.status === "approved";
              const isIssued = req.status === "issued";

              return (
                <div
                  key={req.id}
                  className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-lg hover:border-white/10 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400">
                          {req.final_requisition_id || req.temp_request_id}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                            isPending
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : isApproved
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                              : isIssued
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <h3 className="font-orbitron font-bold text-white text-base mt-1">
                        {req.project_title}
                      </h3>
                    </div>

                    <div className="text-xs text-gray-400 font-mono sm:text-right">
                      <div>Member: <span className="text-white font-bold">{req.user_name}</span> ({req.member_id || "N/A"})</div>
                      <div className="text-[11px] text-gray-500">{req.email}</div>
                    </div>
                  </div>

                  {/* Dates & Purpose */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                    <div>
                      <span className="text-gray-500 block">Takeaway Date</span>
                      <span className="text-gray-200">{req.takeaway_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Expected Return Date</span>
                      <span className="text-gray-200">{req.return_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Duration</span>
                      <span className="text-purple-300 font-bold">{req.total_days} Days</span>
                    </div>
                  </div>

                  {/* Requested Items */}
                  {req.hardware_request_items && req.hardware_request_items.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-gray-500 font-mono text-[10px] block">Items Requested:</span>
                      <div className="flex flex-wrap gap-2">
                        {req.hardware_request_items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.03] text-gray-300 border border-white/[0.06] font-mono text-[11px]"
                          >
                            {item.hardware_name} x{item.qty} (Stock at request: {item.available_at_request_time})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/[0.04]">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleRejectRequest(req)}
                          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-mono transition"
                        >
                          Reject Request
                        </button>

                        <button
                          onClick={() => handleApproveRequest(req)}
                          className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs font-orbitron transition shadow-lg shadow-teal-600/20"
                        >
                          Approve Request (Assign HR ID)
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => handleIssueRequest(req)}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-orbitron transition shadow-lg shadow-purple-600/20"
                      >
                        Mark as Physically Issued
                      </button>
                    )}

                    {isIssued && (
                      <button
                        onClick={() => handleReturnRequest(req)}
                        className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs font-orbitron transition shadow-lg shadow-green-600/20"
                      >
                        Mark Returned to Stock
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Extension Requests Table */
        <div className="space-y-4">
          {extensionRequests.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-xs text-gray-500 font-mono">
              No borrow extension requests submitted.
            </div>
          ) : (
            extensionRequests.map((ext) => (
              <div
                key={ext.id}
                className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 space-y-3 shadow-lg"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-purple-400 font-bold">
                    Requisition ID: {ext.hardware_requests?.final_requisition_id || "N/A"}
                  </span>
                  <span className="font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {ext.status}
                  </span>
                </div>

                <div className="text-xs text-gray-300 space-y-1">
                  <div>
                    Reason: <span className="text-white italic">{ext.reason}</span>
                  </div>
                  <div>
                    New Requested Date:{" "}
                    <span className="text-teal-400 font-mono font-bold">{ext.new_requested_date}</span>
                  </div>
                </div>

                {ext.status === "pending" && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleReviewExtension(ext, "rejected")}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono"
                    >
                      Reject Extension
                    </button>
                    <button
                      onClick={() => handleReviewExtension(ext, "approved")}
                      className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-orbitron font-bold"
                    >
                      Approve Extension
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
