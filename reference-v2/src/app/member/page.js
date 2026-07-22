"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { formatDate } from "@/utils/formatters";
import CountdownWidget from "@/components/requisition/CountdownWidget";
import ExtensionRequestModal from "@/components/requisition/ExtensionRequestModal";
import { generateRequisitionPDF } from "@/lib/pdf/generateRequisitionPDF";

export default function MemberPage() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Tab State: "history" | "requisition" | "borrowed"
  const [activeTab, setActiveTab] = useState("history");

  // Data States
  const [hardwareRequests, setHardwareRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extension Modal State
  const [selectedExtensionRequest, setSelectedExtensionRequest] = useState(null);

  // Own email change state
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch User's V3 Hardware Requests
      const { data: reqData, error: reqError } = await supabase
        .from("hardware_requests")
        .select("*, hardware_request_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!reqError && reqData) {
        setHardwareRequests(reqData);
      }

      // 2. Fetch User's Allocations
      const { data: allocData, error: allocError } = await supabase
        .from("allocations")
        .select("*")
        .eq("userId", user.id);
      
      if (!allocError) {
        const sortedAllocs = (allocData || []).sort((a, b) => {
          if (a.status === b.status) {
            return new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0);
          }
          return a.status === "issued" ? -1 : 1;
        });
        setAllocations(sortedAllocs);
      }

      // 3. Fetch Available Hardware
      const { data: hwData, error: hwError } = await supabase
        .from("hardware")
        .select("*");
      
      if (!hwError) {
        setHardware(hwData || []);
      }
    } catch (err) {
      console.error("[MemberPortal] Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleMemberChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert("Please enter a valid email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      alert("Invalid email format.");
      return;
    }
    const confirmChange = window.confirm(`Are you sure you want to change your portal email address to "${newEmail.trim().toLowerCase()}"?`);
    if (!confirmChange) return;

    setSavingEmail(true);
    try {
      // 1. Update in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
      });
      if (authError) throw authError;

      // 2. Also update profile email in database 'users' table
      await supabase
        .from('users')
        .update({ email: newEmail.trim().toLowerCase() })
        .eq('uid', user.id);

      alert("Email update request sent! Please check both your old and new inbox to confirm the change.");
      setNewEmail("");
    } catch (err) {
      console.error("Error changing email:", err);
      alert("Failed to update email: " + (err.message || err));
    } finally {
      setSavingEmail(false);
    }
  };

  // Handle PDF Re-Download
  const handleRedownloadPDF = async (request) => {
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
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0a0a0d] text-white flex flex-col font-inter pt-20">
        {/* Navigation Header */}
        <header className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-orbitron text-purple-400 font-black text-lg">
                  R
                </div>
                <span className="font-orbitron font-bold tracking-widest text-sm text-gray-200">
                  ROBOTICS CLUB PORTAL
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              {/* Home Website Shortcut Button */}
              <Link
                href="/"
                className="px-3.5 py-2 border border-cyan-500/30 hover:border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-orbitron font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                title="Return to Main Website"
              >
                <span>🏠</span> <span className="hidden sm:inline">Home Website</span>
              </Link>

              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">{profile?.name || "Member"}</span>
                <span className="text-xs text-gray-400 font-mono">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 border border-red-500/20 hover:border-red-500 bg-red-950/10 hover:bg-red-950/30 text-red-400 rounded-lg text-xs font-orbitron transition-all"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          
          {/* Welcome Dashboard */}
          <div className="mb-8 bg-gradient-to-r from-slate-900 via-purple-950/20 to-black border border-white/[0.06] p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                  MEMBER DASHBOARD & HARDWARE PORTAL
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-orbitron mt-3 tracking-wider text-white">
                  Welcome, {profile?.name || "Member"}
                </h1>
                <p className="text-xs text-gray-400 mt-2 max-w-xl leading-relaxed">
                  Track your active hardware requisitions, view Countdown widgets, request borrow extensions, or download official PDF requisition forms.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/"
                  className="px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-300 hover:text-white font-bold text-xs font-orbitron tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <span>🏠</span> HOME WEBSITE
                </Link>

                <Link
                  href="/requisition"
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-orbitron tracking-wider transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 text-center"
                >
                  + NEW REQUISITION
                </Link>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 mb-8 border-b border-white/[0.05] pb-px text-xs font-orbitron">
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 font-bold tracking-wider relative transition-all ${
                activeTab === "history" ? "text-purple-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              REQUISITION HISTORY ({hardwareRequests.length})
              {activeTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("requisition")}
              className={`pb-4 font-bold tracking-wider relative transition-all ${
                activeTab === "requisition" ? "text-purple-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              INVENTORY CATALOG ({hardware.length})
              {activeTab === "requisition" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-4 font-bold tracking-wider relative transition-all ${
                activeTab === "settings" ? "text-purple-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              PORTAL SETTINGS
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          </div>

          {/* Tab Views */}
          {loading ? (
            <div className="text-center py-20 text-purple-400 font-orbitron animate-pulse uppercase tracking-widest text-xs">
              Syncing portal database...
            </div>
          ) : activeTab === "history" ? (
            /* Hardware Requisition History List */
            <div className="space-y-6">
              {hardwareRequests.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/20 border border-white/[0.04] rounded-2xl text-gray-400 text-xs font-mono space-y-3">
                  <p>You have no active or previous hardware requisition requests.</p>
                  <Link
                    href="/requisition"
                    className="inline-block px-4 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-orbitron"
                  >
                    Create Requisition Request
                  </Link>
                </div>
              ) : (
                hardwareRequests.map((req) => {
                  const isIssued = req.status === "issued";
                  const isPending = req.status === "pending";
                  const isApproved = req.status === "approved";
                  const isReturned = req.status === "returned";
                  const isOverdue = req.status === "overdue";

                  const statusColors = {
                    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    approved: "bg-teal-500/10 text-teal-400 border-teal-500/20",
                    issued: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    returned: "bg-gray-500/10 text-gray-400 border-gray-500/20",
                    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
                    overdue: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
                  };

                  return (
                    <div
                      key={req.id}
                      className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-4 hover:border-white/10 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-purple-400">
                              {req.final_requisition_id || req.temp_request_id}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                                statusColors[req.status] || statusColors.pending
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <h3 className="font-orbitron font-bold text-white text-base mt-1">
                            {req.project_title}
                          </h3>
                        </div>

                        {/* Countdown Widget for Issued Requests */}
                        {isIssued && (
                          <CountdownWidget returnDate={req.return_date} status={req.status} />
                        )}
                      </div>

                      {/* Request Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-gray-400">
                        <div>
                          <span className="block text-[10px] text-gray-500 uppercase">Project Type</span>
                          <span className="text-gray-200">{req.project_type || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 uppercase">Takeaway Date</span>
                          <span className="text-gray-200">{req.takeaway_date || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 uppercase">Return Date</span>
                          <span className="text-gray-200">{req.return_date || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 uppercase">Duration</span>
                          <span className="text-purple-300 font-bold">{req.total_days} Days</span>
                        </div>
                      </div>

                      {/* Items Roster */}
                      {req.hardware_request_items && req.hardware_request_items.length > 0 && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-2">
                          <span className="text-[10px] font-mono text-gray-500 uppercase block">
                            Requested Items ({req.hardware_request_items.length}):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {req.hardware_request_items.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-gray-300 border border-white/[0.06]"
                              >
                                {item.hardware_name} (x{item.qty})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.04]">
                        <button
                          onClick={() => handleRedownloadPDF(req)}
                          className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono border border-white/10 transition"
                        >
                          📄 Download PDF
                        </button>

                        {isIssued && (
                          <button
                            onClick={() => setSelectedExtensionRequest(req)}
                            className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-orbitron transition"
                          >
                            Request Extension
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === "requisition" ? (
            /* Catalog Roster */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hardware.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {item.category || "General"}
                    </span>
                    <h3 className="font-orbitron font-bold text-white text-base">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      Stock Available:{" "}
                      <span className="text-green-400 font-bold">{item.availableQuantity ?? item.totalQuantity ?? 0}</span>
                    </p>
                  </div>

                  <Link
                    href="/requisition"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors text-center block"
                  >
                    REQUISITION ITEM →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* Settings Roster */
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                  <h3 className="font-orbitron font-bold text-white text-base">
                    Change Login Email Address
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-inter">
                    Update your registered email address. This will update both your login credentials and profile communications.
                  </p>
                </div>

                <form onSubmit={handleMemberChangeEmail} className="space-y-4 max-w-md font-inter">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="enter new email address..."
                      className="w-full bg-black/40 border border-white/[0.06] hover:border-purple-500/40 focus:border-purple-400 focus:outline-none rounded-lg px-4 py-2 text-sm text-white font-mono transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingEmail || !newEmail.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors uppercase cursor-pointer"
                  >
                    {savingEmail ? "Updating..." : "Update Email"}
                  </button>
                </form>

                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                  <p className="text-[10px] font-mono text-gray-500 leading-relaxed">
                    Note: A verification email link will be sent to the new email address. Your login credentials and database profile will update once confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Extension Request Modal */}
        {selectedExtensionRequest && (
          <ExtensionRequestModal
            request={selectedExtensionRequest}
            user={user}
            onClose={() => setSelectedExtensionRequest(null)}
            onSuccess={fetchData}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
