"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { formatDate } from "@/utils/formatters";

export default function MemberPage() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Tab State: "requisition" | "borrowed"
  const [activeTab, setActiveTab] = useState("requisition");

  // Data States
  const [allocations, setAllocations] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  // Requisition Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [expectedReturn, setExpectedReturn] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch User's Allocations
      const { data: allocData, error: allocError } = await supabase
        .from("allocations")
        .select("*")
        .eq("userId", user.id);
      
      if (allocError) throw allocError;

      // Sort: Active 'issued' items first (newest first), then 'returned' items
      const sortedAllocs = (allocData || []).sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0);
        }
        return a.status === "issued" ? -1 : 1;
      });
      setAllocations(sortedAllocs);

      // 2. Fetch Available Hardware
      const { data: hwData, error: hwError } = await supabase
        .from("hardware")
        .select("*");
      
      if (hwError) throw hwError;
      setHardware(hwData || []);
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

  // Handle Hardware Requisition Request
  const handleOpenRequestModal = (item) => {
    setSelectedItem(item);
    setExpectedReturn("");
    setModalError("");
  };

  const handleCloseRequestModal = () => {
    setSelectedItem(null);
    setExpectedReturn("");
    setModalError("");
  };

  const handleSubmitRequisition = async (e) => {
    e.preventDefault();
    if (!selectedItem || !expectedReturn) {
      setModalError("Please specify an expected return date.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      // Double check availability
      const { data: freshItem, error: getHwError } = await supabase
        .from("hardware")
        .select("availableQuantity, name")
        .eq("id", selectedItem.id)
        .single();
      
      if (getHwError) throw getHwError;

      if (!freshItem || freshItem.availableQuantity <= 0) {
        throw new Error("This item is currently out of stock.");
      }

      // 1. Insert allocation record
      const { error: allocError } = await supabase
        .from("allocations")
        .insert([{
          userId: user.id,
          userName: profile?.name || user.email?.split("@")[0] || "Student",
          memberId: profile?.memberId || "STUDENT",
          itemId: selectedItem.id,
          itemName: freshItem.name,
          expectedReturn: expectedReturn,
          status: "pending",
          issuedAt: null
        }]);

      if (allocError) throw allocError;

      // Reset and reload
      handleCloseRequestModal();
      await fetchData();
      alert("Hardware requisition submitted successfully!");
    } catch (err) {
      console.error("[MemberPortal] Requisition failed:", err);
      setModalError(err.message || "Failed to submit requisition request.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle return of allocated hardware
  const handleReturnItem = async (allocation) => {
    if (!window.confirm(`Are you sure you want to log return for "${allocation.itemName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      // 1. Update allocation status
      const { error: allocError } = await supabase
        .from("allocations")
        .update({
          status: "returned",
          returnedAt: new Date().toISOString()
        })
        .eq("id", allocation.id);

      if (allocError) throw allocError;

      await fetchData();
      alert("Hardware return updated successfully.");
    } catch (err) {
      console.error("[MemberPortal] Return process failed:", err);
      alert("Failed to process hardware return: " + err.message);
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-inter">
        {/* Navigation Header */}
        <header className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md sticky top-0 z-55">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-orbitron text-cyan-400 font-black text-lg">
                R
              </div>
              <span className="font-orbitron font-bold tracking-widest text-sm text-gray-200">
                ROBOTICS CLUB PORTAL
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">{profile?.name || "Student"}</span>
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
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
          
          {/* Welcome Dashboard */}
          <div className="mb-10 bg-gradient-to-r from-slate-900 to-black border border-white/[0.04] p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/5 border border-cyan-500/20 px-3 py-1 rounded-full">
              COLLEGE STUDENT MEMBER ENVIRONMENT
            </span>
            <h1 className="text-3xl font-bold font-orbitron mt-4 tracking-wider uppercase text-white">
              Welcome back, {profile?.name || "Student"}
            </h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xl leading-relaxed">
              Access the campus lab hardware stock to requisition components for projects, or track items currently in your possession.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/[0.05] pb-px">
            <button
              onClick={() => setActiveTab("requisition")}
              className={`pb-4 text-sm font-orbitron font-bold tracking-wider relative transition-all ${
                activeTab === "requisition" ? "text-cyan-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              HARDWARE REQUISITION
              {activeTab === "requisition" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("borrowed")}
              className={`pb-4 text-sm font-orbitron font-bold tracking-wider relative transition-all ${
                activeTab === "borrowed" ? "text-cyan-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              MY BORROWED HARDWARE
              {activeTab === "borrowed" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
              )}
            </button>
          </div>

          {/* Tab Views */}
          {loading ? (
            <div className="text-center py-20 text-cyan-400 font-orbitron animate-pulse uppercase tracking-widest text-sm">
              Syncing Portal database...
            </div>
          ) : activeTab === "requisition" ? (
            /* Hardware Requisition Roster */
            <div>
              {hardware.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/10 border border-white/[0.04] rounded-2xl text-gray-500 font-mono text-sm">
                  No hardware items are cataloged in the inventory system.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {hardware.map((item) => {
                    const isAvailable = item.availableQuantity > 0;
                    return (
                      <div
                        key={item.id}
                        className="glass-card border border-white/[0.05] hover:border-cyan-500/30 rounded-2xl overflow-hidden transition-all flex flex-col justify-between"
                      >
                        {/* Thumbnail image */}
                        <div className="aspect-video bg-slate-950/60 relative overflow-hidden flex items-center justify-center border-b border-white/[0.04]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-slate-700 font-orbitron text-xs font-semibold uppercase">
                              NO THUMBNAIL
                            </div>
                          )}
                          <span
                            className={`absolute top-3 right-3 text-[9px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                              isAvailable
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {isAvailable ? `In Stock (${item.availableQuantity})` : "Out of Stock"}
                          </span>
                        </div>

                        {/* Title and details */}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                              {item.category || "General"}
                            </span>
                            <h3 className="font-orbitron font-bold text-white text-base mt-2.5">
                              {item.name}
                            </h3>
                          </div>

                          <button
                            onClick={() => handleOpenRequestModal(item)}
                            disabled={!isAvailable}
                            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors disabled:opacity-30 disabled:hover:bg-cyan-600"
                          >
                            REQUEST REQUISITION
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* My Borrowed Hardware List */
            <div>
              {allocations.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/10 border border-white/[0.04] rounded-2xl text-gray-500 font-mono text-sm">
                  You have not requisitioned any hardware items.
                </div>
              ) : (
                <div className="space-y-4">
                  {allocations.map((alloc) => {
                    const isIssued = alloc.status === "issued";
                    return (
                      <div
                        key={alloc.id}
                        className="glass-card p-5 border border-white/[0.04] hover:border-cyan-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-orbitron font-bold text-white text-base">
                              {alloc.itemName}
                            </h3>
                            <span
                              className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                                isIssued
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                              }`}
                            >
                              {alloc.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-xs font-mono text-gray-400">
                            <div>
                              <span className="block text-[10px] text-gray-600 uppercase">Issued On</span>
                              <span className="text-gray-300">{formatDate(alloc.issuedAt)}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-600 uppercase">Expected Return</span>
                              <span className="text-gray-300">{alloc.expectedReturn || "N/A"}</span>
                            </div>
                            {alloc.returnedAt && (
                              <div>
                                <span className="block text-[10px] text-gray-600 uppercase">Returned On</span>
                                <span className="text-gray-300">{formatDate(alloc.returnedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isIssued && (
                          <div className="shrink-0 flex items-center">
                            <button
                              onClick={() => handleReturnItem(alloc)}
                              className="px-4 py-2 border border-emerald-500/20 hover:border-emerald-500 bg-emerald-950/10 hover:bg-emerald-950/30 text-emerald-400 rounded-lg text-xs font-orbitron transition-all"
                            >
                              RETURN ITEM
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Requisition Request Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0d0d11] border border-white/[0.08] p-6 rounded-2xl shadow-2xl relative">
              <h3 className="font-orbitron font-bold text-white text-lg mb-2">
                REQUISITION HARDWARE
              </h3>
              <p className="text-xs text-gray-400 mb-6 font-mono">
                Item: {selectedItem.name}
              </p>

              {modalError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmitRequisition} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseRequestModal}
                    className="flex-1 py-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-gray-300 font-orbitron text-xs rounded-xl transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors disabled:opacity-50"
                  >
                    {modalSubmitting ? "PROCESSING..." : "SUBMIT"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
