"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { formatDate } from "@/utils/formatters";
import CountdownWidget from "@/components/requisition/CountdownWidget";
import ExtensionRequestModal from "@/components/requisition/ExtensionRequestModal";
import RequisitionDetailModal from "@/components/requisition/RequisitionDetailModal";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { LiquidGlassCard } from "@/components/ui/liquid-glass";
import { generateRequisitionPDF } from "@/lib/pdf/generateRequisitionPDF";

export default function MemberPage() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Tab State: "history" | "requisition" | "settings"
  const [activeTab, setActiveTab] = useState("history");

  // Data States
  const [hardwareRequests, setHardwareRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedExtensionRequest, setSelectedExtensionRequest] = useState(null);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState(null);

  // History Search & Filter State
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  // Catalog Search & Filter State
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");

  // Own email change state
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch User's Hardware Requests
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

      // 3. Fetch Available Hardware Catalog
      const { data: hwData, error: hwError } = await supabase
        .from("hardware")
        .select("*");
      
      if (!hwError) {
        setHardware(hwData || []);
      }
    } catch (err) {
      console.error("[MemberHub] Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  // Derived Summary Metrics
  const summaryMetrics = useMemo(() => {
    const issuedCount = hardwareRequests.filter((r) => r.status === "issued").length;
    const pendingCount = hardwareRequests.filter((r) => r.status === "pending").length;
    
    // Find earliest upcoming return date among issued requests
    const issuedRequests = hardwareRequests.filter((r) => r.status === "issued" && r.return_date);
    let nearestReturnDays = null;
    let overdueCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    issuedRequests.forEach((req) => {
      const returnDate = new Date(req.return_date);
      returnDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        overdueCount++;
      } else {
        if (nearestReturnDays === null || diffDays < nearestReturnDays) {
          nearestReturnDays = diffDays;
        }
      }
    });

    return {
      issuedCount,
      pendingCount,
      overdueCount,
      nearestReturnDays,
    };
  }, [hardwareRequests]);

  // Filtered History Requests
  const filteredRequests = useMemo(() => {
    return hardwareRequests.filter((req) => {
      const matchSearch =
        !historySearch.trim() ||
        req.project_title?.toLowerCase().includes(historySearch.toLowerCase()) ||
        req.temp_request_id?.toLowerCase().includes(historySearch.toLowerCase()) ||
        req.final_requisition_id?.toLowerCase().includes(historySearch.toLowerCase());

      const matchStatus =
        historyStatusFilter === "all" || req.status?.toLowerCase() === historyStatusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [hardwareRequests, historySearch, historyStatusFilter]);

  // Catalog Categories & Filtered Items
  const catalogCategories = useMemo(() => {
    const cats = new Set(hardware.map((item) => item.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [hardware]);

  const filteredHardware = useMemo(() => {
    return hardware.filter((item) => {
      const matchSearch =
        !catalogSearch.trim() ||
        item.name?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.category?.toLowerCase().includes(catalogSearch.toLowerCase());

      const matchCategory =
        catalogCategory === "all" || item.category?.toLowerCase() === catalogCategory.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [hardware, catalogSearch, catalogCategory]);

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
    const confirmChange = window.confirm(`Are you sure you want to change your email address to "${newEmail.trim().toLowerCase()}"?`);
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

  const firstName = profile?.name ? profile.name.split(" ")[0] : "Member";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-inter pt-24 pb-16 transition-colors duration-300">
        
        {/* Top Header Navigation (Homepage Glass Look) */}
        <header className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1200px] z-50">
          <LiquidGlassCard
            blurIntensity="xl"
            borderRadius="20px"
            glowIntensity="sm"
            shadowIntensity="md"
            className="w-full py-3 px-4 sm:px-6 flex items-center justify-between"
          >
            {/* Branding */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-orange-glow)] border border-[var(--accent-orange)]/40 flex items-center justify-center font-orbitron text-[var(--accent-orange)] font-black text-lg group-hover:scale-105 transition-transform">
                R
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-bold tracking-widest text-xs sm:text-sm text-[var(--text-primary)]">
                  ROBOTICS CLUB
                </span>
                <span className="font-orbitron text-[10px] text-[var(--accent-purple)] font-bold tracking-wider">
                  MEMBER HUB
                </span>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeSwitcher />

              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-orbitron font-bold transition-all flex items-center gap-1.5"
                title="Return to Main Website"
              >
                <span>🏠</span> <span className="hidden md:inline">Home Website</span>
              </Link>

              <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-teal-glow)] border border-[var(--accent-teal)]/40 flex items-center justify-center text-[var(--accent-teal)] font-bold text-xs font-orbitron">
                  {firstName.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{profile?.name || "Member"}</span>
              </div>

              <button
                onClick={logout}
                className="px-3.5 py-1.5 border border-red-500/20 hover:border-red-500/50 bg-red-950/10 hover:bg-red-950/30 text-red-400 rounded-full text-xs font-orbitron font-bold transition-all"
              >
                LOGOUT
              </button>
            </div>
          </LiquidGlassCard>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
          
          {/* Member Hub Hero Banner */}
          <div className="glass-card p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl border-[var(--border-card)] space-y-6">
            <div className="absolute -right-10 -top-10 w-96 h-96 bg-[var(--accent-purple-glow)] rounded-full blur-3xl pointer-events-none opacity-60" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent-orange)]/30 bg-[var(--accent-orange-glow)] text-[var(--accent-orange)] font-orbitron font-bold text-[10px] sm:text-xs tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-orange)] animate-pulse" />
                  MEMBER HUB
                </span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-orbitron tracking-tight text-[var(--text-primary)]">
                  Welcome back, {firstName}.
                </h1>

                <p className="text-sm sm:text-base text-[var(--text-secondary)] font-inter leading-relaxed">
                  Manage your hardware requests, track borrowed equipment, and access club resources.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/requisition"
                  className="px-6 py-3.5 rounded-2xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-bold text-xs sm:text-sm font-orbitron tracking-wider transition-all shadow-xl shadow-[var(--accent-purple-glow)] flex items-center justify-center gap-2 text-center"
                >
                  <span>+</span> NEW REQUISITION
                </Link>
              </div>
            </div>

            {/* Contextual Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-subtle)] relative z-10">
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block font-semibold">
                  Active Borrowed Equipment
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-orbitron text-[var(--accent-teal)]">
                    {summaryMetrics.issuedCount}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">item(s) held</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block font-semibold">
                  Pending Approvals
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-orbitron text-[var(--accent-orange)]">
                    {summaryMetrics.pendingCount}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">request(s)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block font-semibold">
                  Return Status
                </span>
                {summaryMetrics.overdueCount > 0 ? (
                  <div className="text-xs font-mono text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {summaryMetrics.overdueCount} Request(s) Overdue
                  </div>
                ) : summaryMetrics.nearestReturnDays !== null ? (
                  <div className="text-xs font-mono text-[var(--accent-teal)] font-bold">
                    Next Return in {summaryMetrics.nearestReturnDays} Day(s)
                  </div>
                ) : (
                  <div className="text-xs font-mono text-[var(--text-muted)]">
                    No active returns due
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-6 border-b border-[var(--border-subtle)] pb-px text-xs sm:text-sm font-orbitron">
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 font-bold tracking-wider relative transition-colors ${
                activeTab === "history"
                  ? "text-[var(--accent-purple)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              MY REQUISITIONS ({hardwareRequests.length})
              {activeTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-purple)] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("requisition")}
              className={`pb-4 font-bold tracking-wider relative transition-colors ${
                activeTab === "requisition"
                  ? "text-[var(--accent-purple)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              INVENTORY CATALOG ({hardware.length})
              {activeTab === "requisition" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-purple)] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-4 font-bold tracking-wider relative transition-colors ${
                activeTab === "settings"
                  ? "text-[var(--accent-purple)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              PROFILE & SETTINGS
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-purple)] rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Views */}
          {loading ? (
            <div className="text-center py-20 text-[var(--accent-purple)] font-orbitron animate-pulse uppercase tracking-widest text-xs sm:text-sm">
              Syncing Member Hub Database...
            </div>
          ) : activeTab === "history" ? (
            /* Hardware Requisition History List */
            <div className="space-y-6">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by project title or request ID..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                  {historySearch && (
                    <button
                      onClick={() => setHistorySearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
                  {["all", "pending", "approved", "issued", "returned", "rejected", "overdue"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setHistoryStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg border capitalize whitespace-nowrap transition-all ${
                        historyStatusFilter === status
                          ? "bg-[var(--accent-purple)] text-[var(--bg-primary)] border-[var(--accent-purple)] font-bold font-orbitron"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl text-[var(--text-secondary)] text-xs font-mono space-y-4">
                  <p>No requisition records matching your criteria.</p>
                  <Link
                    href="/requisition"
                    className="inline-block px-5 py-2.5 rounded-xl bg-[var(--accent-purple)] text-[var(--bg-primary)] font-orbitron font-bold text-xs shadow-lg shadow-[var(--accent-purple-glow)]"
                  >
                    + Create Requisition Request
                  </Link>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const isIssued = req.status === "issued";

                  const statusColors = {
                    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                    approved: "bg-teal-500/15 text-teal-300 border-teal-500/30",
                    issued: "bg-[var(--accent-purple-glow)] text-[var(--accent-purple)] border-[var(--accent-purple)]/40",
                    returned: "bg-gray-500/15 text-gray-300 border-gray-500/30",
                    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
                    overdue: "bg-red-500/25 text-red-300 border-red-500/40 animate-pulse",
                  };

                  const items = req.hardware_request_items || [];
                  const displayedItems = items.slice(0, 3);
                  const remainingItemCount = items.length - 3;

                  return (
                    <div
                      key={req.id}
                      className="glass-card rounded-2xl p-6 sm:p-7 space-y-5 border-[var(--border-card)] hover:border-[var(--accent-purple)]/40 transition-all duration-300 shadow-xl"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-orbitron font-bold text-sm text-[var(--accent-purple)] tracking-wider">
                              {req.final_requisition_id || req.temp_request_id}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-3 py-0.5 rounded-full border ${
                                statusColors[req.status] || statusColors.pending
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <h3 className="font-orbitron font-bold text-[var(--text-primary)] text-lg sm:text-xl tracking-wide mt-1">
                            {req.project_title}
                          </h3>
                        </div>

                        {/* Issued Requisition Countdown Bar */}
                        {isIssued && (
                          <CountdownWidget
                            returnDate={req.return_date}
                            takeawayDate={req.takeaway_date}
                            status={req.status}
                          />
                        )}
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[var(--text-secondary)]">
                        <div>
                          <span className="block text-[10px] text-[var(--text-muted)] uppercase font-semibold">Project Type</span>
                          <span className="text-[var(--text-primary)] font-medium">{req.project_type || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[var(--text-muted)] uppercase font-semibold">Takeaway Date</span>
                          <span className="text-[var(--text-primary)] font-medium">{req.takeaway_date || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[var(--text-muted)] uppercase font-semibold">Return Date</span>
                          <span className="text-[var(--text-primary)] font-medium">{req.return_date || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[var(--text-muted)] uppercase font-semibold">Duration</span>
                          <span className="text-[var(--accent-orange)] font-bold">{req.total_days || 0} Days</span>
                        </div>
                      </div>

                      {/* Components Roster (Max 3-4 Chips) */}
                      {items.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block font-semibold">
                            Requested Components ({items.length}):
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {displayedItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-xs font-mono px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-card)]"
                              >
                                {item.hardware_name} <span className="text-[var(--accent-teal)] font-bold">(x{item.qty})</span>
                              </span>
                            ))}
                            {remainingItemCount > 0 && (
                              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-[var(--accent-purple-glow)] text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 font-bold">
                                +{remainingItemCount} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Card Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-subtle)]">
                        <button
                          onClick={() => setSelectedDetailRequest(req)}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-mono font-semibold border border-[var(--border-card)] transition-colors"
                        >
                          🔍 View Details
                        </button>

                        <button
                          onClick={() => handleRedownloadPDF(req)}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-mono font-semibold border border-[var(--border-card)] transition-colors"
                        >
                          📄 Download PDF
                        </button>

                        {isIssued && (
                          <button
                            onClick={() => setSelectedExtensionRequest(req)}
                            className="px-4 py-2 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-orbitron font-bold text-xs transition-colors shadow-md shadow-[var(--accent-purple-glow)]"
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
            /* Inventory Catalog View */
            <div className="space-y-6">
              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search equipment catalog..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
                  {catalogCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCatalogCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg border capitalize whitespace-nowrap transition-all ${
                        catalogCategory === cat
                          ? "bg-[var(--accent-purple)] text-[var(--bg-primary)] border-[var(--accent-purple)] font-bold font-orbitron"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredHardware.map((item) => {
                  const avail = item.availableQuantity ?? item.totalQuantity ?? 0;
                  const isAvailable = avail > 0;

                  return (
                    <div
                      key={item.id}
                      className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border-[var(--border-card)] hover:border-[var(--accent-purple)]/40 transition-all shadow-lg"
                    >
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--accent-orange)] border border-[var(--border-subtle)] inline-block">
                          {item.category || "General"}
                        </span>
                        <h3 className="font-orbitron font-bold text-[var(--text-primary)] text-base leading-snug">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                          <span>Stock Availability:</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${isAvailable ? "bg-teal-500/15 text-teal-300 border border-teal-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                            {avail} Available
                          </span>
                        </div>
                      </div>

                      <Link
                        href="/requisition"
                        className="w-full py-2.5 bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-orbitron font-bold text-xs rounded-xl tracking-wider transition-all text-center block shadow-md shadow-[var(--accent-purple-glow)]"
                      >
                        + REQUISITION ITEM
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Profile & Settings View */
            <div className="max-w-3xl space-y-6">
              {/* Authenticated Member Profile Overview Card */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 border-[var(--border-card)] shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[var(--accent-teal)] animate-pulse shadow-[0_0_10px_var(--accent-teal-glow)]" />
                    <h2 className="font-orbitron text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-wider">
                      MEMBER PROFILE SUMMARY
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--accent-teal)] border border-[var(--border-card)] font-bold">
                    READONLY SYNCED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  {/* Avatar */}
                  <div className="flex flex-col items-center justify-center space-y-2 md:border-r border-[var(--border-subtle)] pr-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent-purple)] bg-[var(--bg-secondary)] flex items-center justify-center">
                      {profile?.photoURL ? (
                        <Image
                          src={profile.photoURL}
                          alt={profile.name || "Member"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold font-orbitron text-[var(--accent-purple)]">
                          {profile?.name?.charAt(0) || "M"}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold">
                      ROLE: {profile?.role?.toUpperCase() || "MEMBER"}
                    </span>
                  </div>

                  {/* Profile Details Grid */}
                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Full Name</span>
                      <span className="text-[var(--text-primary)] font-bold text-sm">{profile?.name || "N/A"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Email Address</span>
                      <span className="text-[var(--text-primary)] font-semibold">{profile?.email || user?.email || "N/A"}</span>
                    </div>

                    {/* Distinct Field 1: University Roll Number */}
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">University Roll Number</span>
                      <span className="text-[var(--accent-orange)] font-bold text-sm">
                        {profile?.roll_number || profile?.rollNo || profile?.roll_no || "N/A"}
                      </span>
                    </div>

                    {/* Distinct Field 2: RC Member ID */}
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">RC Member ID</span>
                      <span className="text-[var(--accent-purple)] font-bold text-sm">
                        {profile?.memberId || profile?.member_id || profile?.rc_id || "N/A"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Branch / Department</span>
                      <span className="text-[var(--text-primary)] font-medium">{profile?.branch || profile?.department || "N/A"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Section & Year</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {profile?.section ? `Sec ${profile.section}` : "N/A"} • Year {profile?.year || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Change Card */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 border-[var(--border-card)] shadow-xl space-y-6">
                <div>
                  <h3 className="font-orbitron font-bold text-[var(--text-primary)] text-base sm:text-lg">
                    Change Login Email Address
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-inter">
                    Update your registered email address. This will update both your login credentials and profile communications.
                  </p>
                </div>

                <form onSubmit={handleMemberChangeEmail} className="space-y-4 max-w-md font-inter">
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="enter new email address..."
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] hover:border-[var(--accent-purple)] focus:border-[var(--accent-purple)] focus:outline-none rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] font-mono transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingEmail || !newEmail.trim()}
                    className="px-6 py-3 bg-[var(--accent-purple)] hover:brightness-110 disabled:opacity-50 text-[var(--bg-primary)] font-orbitron font-bold text-xs rounded-xl tracking-wider transition-all uppercase cursor-pointer shadow-md shadow-[var(--accent-purple-glow)]"
                  >
                    {savingEmail ? "Updating Email..." : "Update Email"}
                  </button>
                </form>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                  <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">
                    Note: A verification confirmation link will be dispatched to your new email address. Your login credentials and database profile will complete updating once confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Requisition Detail Modal */}
        {selectedDetailRequest && (
          <RequisitionDetailModal
            request={selectedDetailRequest}
            user={user}
            onClose={() => setSelectedDetailRequest(null)}
            onRequestExtension={(req) => setSelectedExtensionRequest(req)}
          />
        )}

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
