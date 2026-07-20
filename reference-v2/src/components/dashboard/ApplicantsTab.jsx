"use client";

import React, { useState, useEffect } from "react";
import { fetchApplicants, updateApplicantStatus, generateNextMemberId, deleteUser, deleteBulkUsers } from "@/lib/supabase/dashboardService";
import { sendStatusNotification } from "@/lib/mail";
import ApplicantDetailModal from "./ApplicantDetailModal";

export default function ApplicantsTab() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Row selection checkboxes for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Image preview state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Roster view toggle state: "general" | "team"
  const [rosterView, setRosterView] = useState("general");

  async function loadData() {
    try {
      setLoading(true);
      const data = await fetchApplicants();
      setApplicants(data);
      setError(null);
    } catch (err) {
      console.error("Error loading applicants:", err);
      setError("Failed to retrieve applicants from database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  // Checkbox selection functions
  const toggleSelectAll = (filteredItems) => {
    const allChecked = filteredItems.length > 0 && filteredItems.every(item => selectedIds.has(item.id));
    const newSelected = new Set(selectedIds);
    if (allChecked) {
      filteredItems.forEach(item => newSelected.delete(item.id));
    } else {
      filteredItems.forEach(item => newSelected.add(item.id));
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // CSV Export Functionality
  const exportToCSV = () => {
    // Export selected items if checkboxed, else export all filtered items
    const recordsToExport = selectedIds.size > 0 
      ? applicants.filter(a => selectedIds.has(a.id))
      : filteredApplicants;
      
    if (recordsToExport.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = ["Member ID", "Name", "Email", "Phone", "Branch", "Year", "Section", "Interests", "Reason", "Status", "Created At", "Admin Notes"];
    const rows = recordsToExport.map(a => [
      a.memberId || "PENDING",
      a.name || "",
      a.email || "",
      a.phone || "",
      a.branch || "",
      a.year || "",
      a.section || "",
      a.interests || "",
      (a.reason || "").replace(/"/g, '""').replace(/\n/g, " "), 
      a.status || "pending",
      a.createdAt || "",
      (a.adminNotes || "").replace(/"/g, '""').replace(/\n/g, " ")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `applicants_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Approval / Rejection Workflow
  const handleUpdateStatus = async (applicant, newStatus) => {
    const confirmAction = window.confirm(
      `Are you sure you want to mark "${applicant.name}" as ${newStatus.toUpperCase()}?`
    );
    if (!confirmAction) return;

    try {
      setActionLoading(true);
      let assignedId = null;

      if (newStatus === "accepted") {
        // Safe sequential ID generation (e.g. RC-26-0001)
        assignedId = await generateNextMemberId();
      }

      // Update in Firestore using isolated service helper
      await updateApplicantStatus(applicant.id, newStatus, assignedId);

      // Trigger Email Integration
      try {
        console.log(`[MAIL] Dispatching notification mail to: ${applicant.email}`);
        await sendStatusNotification(
          applicant.email,
          applicant.name || "Student",
          assignedId || applicant.memberId || "PENDING",
          newStatus
        );
      } catch (mailErr) {
        console.error("[MAIL] Notification service failed to dispatch email:", mailErr);
        alert(`Status updated in database, but email notification failed: ${mailErr.message || mailErr}`);
      }

      alert(`Applicant successfully marked as ${newStatus.toUpperCase()}${assignedId ? `. Generated ID: ${assignedId}` : ""}`);
      
      // Reload lists to fetch fresh state
      await loadData();
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`Action failed: ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User Handler (Single)
  const handleDeleteApplicant = async (applicant) => {
    const confirmDelete = window.confirm(
      `[SUPER ADMIN] Are you sure you want to permanently delete user "${applicant.name || applicant.email}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      await deleteUser(applicant.id);
      alert(`User "${applicant.name || applicant.email}" was deleted successfully.`);
      if (selectedApplicant?.id === applicant.id) {
        setSelectedApplicant(null);
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(applicant.id);
        return next;
      });
      await loadData();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(`Failed to delete user: ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Users Handler (Bulk Checkbox Selection)
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmDelete = window.confirm(
      `[SUPER ADMIN] Are you sure you want to permanently delete the ${selectedIds.size} selected user(s)? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      await deleteBulkUsers(Array.from(selectedIds));
      alert(`${selectedIds.size} user(s) were deleted successfully.`);
      setSelectedIds(new Set());
      await loadData();
    } catch (err) {
      console.error("Error deleting selected users:", err);
      alert(`Failed to delete users: ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Stats Calculations
  const totalCount = applicants.length;
  const pendingCount = applicants.filter((a) => a.status === "pending").length;
  const acceptedCount = applicants.filter((a) => a.status === "accepted").length;
  const rejectedCount = applicants.filter((a) => a.status === "rejected").length;
  const acceptanceRate = totalCount > 0 ? ((acceptedCount / totalCount) * 100).toFixed(1) : "0.0";

  // Filter & Search Logic
  const filteredApplicants = applicants.filter((a) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return statusFilter === "all" || a.status === statusFilter;

    const nameMatch = a.name ? a.name.toLowerCase().includes(query) : false;
    const emailMatch = a.email ? a.email.toLowerCase().includes(query) : false;
    const branchMatch = a.branch ? a.branch.toLowerCase().includes(query) : false;
    const memberIdMatch = a.memberId ? a.memberId.toLowerCase().includes(query) : false;

    // Improved Search: automatically fill RC-year (RC-26-)
    const currentYear2Digit = new Date().getFullYear().toString().slice(-2); // "26"
    let searchId = query;
    if (/^\d+$/.test(query)) {
      // e.g. search "5" -> fills "rc-26-0005"
      searchId = `rc-${currentYear2Digit}-${query.padStart(4, "0")}`;
    } else if (/^\d{2}-\d+$/.test(query)) {
      // e.g. search "26-0005" -> fills "rc-26-0005"
      searchId = `rc-${query}`;
    }
    const smartIdMatch = a.memberId ? a.memberId.toLowerCase().includes(searchId) : false;

    const statusMatch = statusFilter === "all" || a.status === statusFilter;
    return (nameMatch || emailMatch || branchMatch || memberIdMatch || smartIdMatch) && statusMatch;
  });

  const teamStaffList = filteredApplicants.filter(a => ["admin", "technical", "ops", "data", "secretary"].includes(a.role));
  const generalList = filteredApplicants.filter(a => !["admin", "technical", "ops", "data", "secretary"].includes(a.role));

  // Role badge helper with tailored styling per staff assignment
  const getRoleBadge = (roleVal) => {
    const role = (roleVal || "member").toLowerCase();
    let style = "bg-gray-500/10 text-gray-400 border-gray-500/25";
    if (role === "admin") style = "bg-purple-500/10 text-purple-400 border-purple-500/25";
    else if (role === "technical") style = "bg-blue-500/10 text-blue-400 border-blue-500/25";
    else if (role === "ops") style = "bg-orange-500/10 text-orange-400 border-orange-500/25";
    else if (role === "data") style = "bg-teal-500/10 text-teal-400 border-teal-500/25";
    else if (role === "secretary") style = "bg-pink-500/10 text-pink-400 border-pink-500/25";
    
    return (
      <span className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-extrabold uppercase tracking-wider ${style}`}>
        ${role}
      </span>
    );
  };

  // Standardized Status Badge Component with Dot Indicators
  const renderStatusBadge = (statusVal) => {
    const statusLower = (statusVal || "pending").toLowerCase();
    if (statusLower === "accepted") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          ACCEPTED
        </span>
      );
    }
    if (statusLower === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        PENDING
      </span>
    );
  };

  return (
    <div className="space-y-8 font-inter">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#111115] border border-white/[0.04] p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-orbitron tracking-widest font-bold uppercase">
            Total Applicants
          </span>
          <span className="text-3xl font-bold font-orbitron text-white mt-2">{totalCount}</span>
        </div>
        
        <div className="bg-[#111115] border border-white/[0.04] p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <span className="text-[10px] text-yellow-500 font-orbitron tracking-widest font-bold uppercase">
            Pending Review
          </span>
          <span className="text-3xl font-bold font-orbitron text-yellow-400 mt-2">{pendingCount}</span>
        </div>

        <div className="bg-[#111115] border border-white/[0.04] p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <span className="text-[10px] text-green-500 font-orbitron tracking-widest font-bold uppercase">
            Accepted
          </span>
          <span className="text-3xl font-bold font-orbitron text-green-400 mt-2">{acceptedCount}</span>
        </div>

        <div className="bg-[#111115] border border-white/[0.04] p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <span className="text-[10px] text-red-500 font-orbitron tracking-widest font-bold uppercase">
            Rejected
          </span>
          <span className="text-3xl font-bold font-orbitron text-red-400 mt-2">{rejectedCount}</span>
        </div>

        <div className="bg-[#111115] border border-white/[0.04] p-5 rounded-xl shadow-lg flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] text-cyan-500 font-orbitron tracking-widest font-bold uppercase">
            Acceptance Rate
          </span>
          <span className="text-3xl font-bold font-orbitron text-cyan-400 mt-2">
            {acceptanceRate}%
          </span>
        </div>
      </div>

      {/* Bulk actions status panel */}
      {selectedIds.size > 0 && (
        <div className="bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            {selectedIds.size} APPLICANT(S) SELECTED FOR BULK ACTION
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-orbitron font-bold text-white rounded border border-slate-700 transition-colors"
            >
              CLEAR SELECTION
            </button>
            <span className="text-[10px] text-gray-500 font-mono italic flex items-center pl-2">
              Bulk actions locked
            </span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#111115] border border-white/[0.04] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="w-full md:w-96 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search name, email, branch, or memberId..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg text-white font-inter placeholder-gray-500 transition-colors"
          />
        </div>

        {/* CSV Export, Bulk Delete & Filters */}
        <div className="flex w-full md:w-auto items-center justify-end gap-3 shrink-0">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-600 text-xs font-orbitron font-bold rounded-lg border border-red-500/30 transition-colors cursor-pointer text-red-400 hover:text-white disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              DELETE ({selectedIds.size})
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-orbitron font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer text-cyan-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            EXPORT CSV
          </button>
          
          <span className="text-xs text-gray-500 font-orbitron tracking-wider">FILTER:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-xs font-semibold text-gray-300 transition-colors"
          >
            <option value="all">ALL STATUSES</option>
            <option value="pending">PENDING</option>
            <option value="accepted">ACCEPTED</option>
            <option value="rejected">REJECTED</option>
          </select>
        </div>

      </div>

      {/* Roster View Buttons */}
      <div className="bg-black/50 border border-white/[0.05] p-1.5 rounded-xl flex gap-2 w-fit mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        <button
          onClick={() => setRosterView("general")}
          className={`px-4 py-2 rounded-lg font-orbitron font-bold text-[10px] tracking-wider transition-all duration-200 border cursor-pointer flex items-center gap-2 ${
            rosterView === "general"
              ? "bg-[#16161a] text-cyan-400 border-cyan-500/20 shadow-[0_4px_12px_rgba(6,182,212,0.15)] scale-[1.02]"
              : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.02]"
          }`}
        >
          GENERAL ROSTER
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
            rosterView === "general"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
              : "bg-white/[0.04] text-gray-500"
          }`}>
            {generalList.length}
          </span>
        </button>
        <button
          onClick={() => setRosterView("team")}
          className={`px-4 py-2 rounded-lg font-orbitron font-bold text-[10px] tracking-wider transition-all duration-200 border cursor-pointer flex items-center gap-2 ${
            rosterView === "team"
              ? "bg-[#16161a] text-cyan-400 border-cyan-500/20 shadow-[0_4px_12px_rgba(6,182,212,0.15)] scale-[1.02]"
              : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.02]"
          }`}
        >
          TEAM & STAFF
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
            rosterView === "team"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
              : "bg-white/[0.04] text-gray-500"
          }`}>
            {teamStaffList.length}
          </span>
        </button>
      </div>

      {/* Main Table Grid */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg p-6">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-mono text-sm">
            &gt; Syncing application registers...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 font-mono text-sm">
            &gt; ERROR: {error}
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic text-sm">
            No applicants found matching current search/filter.
          </div>
        ) : (
          <>
            {/* Section 1: Team & Staff */}
            {rosterView === "team" && (
              teamStaffList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic text-sm">
                  No team & staff members found matching current search/filter.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                    <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest">
                      Team & Staff Members ({teamStaffList.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                          <th className="p-4 pl-6 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={teamStaffList.length > 0 && teamStaffList.every(item => selectedIds.has(item.id))}
                              onChange={() => toggleSelectAll(teamStaffList)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                            />
                          </th>
                          <th className="p-4">Profile</th>
                          <th className="p-4">Year / Branch</th>
                          <th className="p-4">Interests</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {teamStaffList.map((applicant) => (
                          <tr key={applicant.id} className="hover:bg-white/[0.015] hover:shadow-[inset_4px_0_0_0_#06b6d4] border-l border-l-transparent transition-all duration-150">
                            <td className="p-4 pl-6 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(applicant.id)}
                                onChange={() => toggleSelectOne(applicant.id)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 flex items-center gap-3">
                              <div 
                                onClick={() => setPreviewImageUrl(applicant.photoURL)}
                                title="Click to view fullsize profile photo"
                                className="w-10 h-10 rounded-full border border-white/[0.1] bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                              >
                                {applicant.photoURL ? (
                                  <img
                                    src={applicant.photoURL}
                                    alt={`${applicant.name || "User"}'s avatar`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = "none";
                                      e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-semibold text-xs">${(applicant.name || "N")[0].toUpperCase()}</div>`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-semibold text-xs">
                                    {(applicant.name || "N")[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                  {applicant.name}
                                  {getRoleBadge(applicant.role)}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{applicant.email}</div>
                                {applicant.memberId && applicant.memberId !== "PENDING" && (
                                  <div className="text-[10px] font-mono text-cyan-500 mt-0.5 font-semibold">
                                    {applicant.memberId}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-xs">
                              <div className="text-gray-300 font-medium">{applicant.year ? `${applicant.year} Year` : "-"}</div>
                              <div className="text-gray-500 font-mono mt-0.5">{applicant.branch || "-"}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded bg-[#18181b] border border-white/[0.04] text-[10px] font-mono text-cyan-300 uppercase tracking-wide">
                                {applicant.interests || "General"}
                              </span>
                            </td>
                            <td className="p-4">
                              {renderStatusBadge(applicant.status)}
                            </td>
                             <td className="p-4 pr-6 text-right space-x-2 shrink-0">
                              <button
                                onClick={() => {
                                  console.log("[ApplicantsTab] Clicking details for:", applicant);
                                  setSelectedApplicant(applicant);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-orbitron font-bold rounded tracking-wider border border-slate-700 transition-colors"
                              >
                                DETAILS
                              </button>
                              {applicant.status !== "accepted" && (
                                <button
                                  onClick={() => handleUpdateStatus(applicant, "accepted")}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-green-950/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                                >
                                  ACCEPT
                                </button>
                              )}
                              {applicant.status !== "rejected" && (
                                <button
                                  onClick={() => handleUpdateStatus(applicant, "rejected")}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-yellow-950/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                                >
                                  REJECT
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteApplicant(applicant)}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                                title="Permanently delete user profile"
                              >
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* Section 2: General Members & Applicants */}
            {rosterView === "general" && (
              generalList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic text-sm">
                  No general members or applicants found matching current search/filter.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                    <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest">
                      General Members & Applicants ({generalList.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                          <th className="p-4 pl-6 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={generalList.length > 0 && generalList.every(item => selectedIds.has(item.id))}
                              onChange={() => toggleSelectAll(generalList)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                            />
                          </th>
                          <th className="p-4">Profile</th>
                          <th className="p-4">Year / Branch</th>
                          <th className="p-4">Interests</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {generalList.map((applicant) => (
                          <tr key={applicant.id} className="hover:bg-white/[0.015] hover:shadow-[inset_4px_0_0_0_#06b6d4] border-l border-l-transparent transition-all duration-150">
                            <td className="p-4 pl-6 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(applicant.id)}
                                onChange={() => toggleSelectOne(applicant.id)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 flex items-center gap-3">
                              <div 
                                onClick={() => setPreviewImageUrl(applicant.photoURL)}
                                title="Click to view fullsize profile photo"
                                className="w-10 h-10 rounded-full border border-white/[0.1] bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                              >
                                {applicant.photoURL ? (
                                  <img
                                    src={applicant.photoURL}
                                    alt={`${applicant.name || "User"}'s avatar`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = "none";
                                      e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-semibold text-xs">${(applicant.name || "N")[0].toUpperCase()}</div>`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-semibold text-xs">
                                    {(applicant.name || "N")[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                  {applicant.name}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{applicant.email}</div>
                                {applicant.memberId && applicant.memberId !== "PENDING" && (
                                  <div className="text-[10px] font-mono text-cyan-500 mt-0.5 font-semibold">
                                    {applicant.memberId}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-xs">
                              <div className="text-gray-300 font-medium">{applicant.year} Year</div>
                              <div className="text-gray-500 font-mono mt-0.5">{applicant.branch}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded bg-[#18181b] border border-white/[0.04] text-[10px] font-mono text-cyan-300 uppercase tracking-wide">
                                {applicant.interests || "General"}
                              </span>
                            </td>
                            <td className="p-4">
                              {renderStatusBadge(applicant.status)}
                            </td>
                            <td className="p-4 pr-6 text-right space-x-2 shrink-0">
                              <button
                                onClick={() => {
                                  console.log("[ApplicantsTab] Clicking details for:", applicant);
                                  setSelectedApplicant(applicant);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-orbitron font-bold rounded tracking-wider border border-slate-700 transition-colors"
                              >
                                DETAILS
                              </button>
                              {applicant.status !== "accepted" && (
                                <button
                                  onClick={() => handleUpdateStatus(applicant, "accepted")}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-green-950/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                                >
                                  ACCEPT
                                </button>
                              )}
                              {applicant.status !== "rejected" && (
                                <button
                                  onClick={() => handleUpdateStatus(applicant, "rejected")}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-yellow-950/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                                >
                                  REJECT
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteApplicant(applicant)}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                                title="Permanently delete user profile"
                              >
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Applicant Detail View */}
      {selectedApplicant && (
        <ApplicantDetailModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onUpdateApplicant={(updatedApp) => {
            setApplicants(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
            setSelectedApplicant(updatedApp);
          }}
          onDeleteApplicant={(deletedId) => {
            setApplicants(prev => prev.filter(a => a.id !== deletedId));
            setSelectedApplicant(null);
          }}
        />
      )}

      {/* Standalone Full-size Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setPreviewImageUrl(null)}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <div className="relative z-10 bg-[#111115] border border-white/10 max-w-3xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-md hover:bg-black/90 text-white p-2 rounded-full border border-white/10 transition-colors z-20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImageUrl}
              alt="Profile full size preview"
              className="max-w-full max-h-[70vh] object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = `<div class="p-12 text-center text-gray-500 font-mono text-sm">Image failed to load.</div>`;
              }}
            />
            <div className="p-4 bg-black/40 text-center text-xs font-mono text-cyan-400 w-full border-t border-white/[0.05]">
              PROFILE PHOTO FULL-SIZE PREVIEW
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
