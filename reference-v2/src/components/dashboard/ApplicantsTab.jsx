"use client";

import React, { useState, useEffect } from "react";
import { fetchApplicants, updateApplicantStatus, generateNextMemberId } from "@/lib/firebase/dashboardService";
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

  // Standardized Status Badge Colors Helper
  const getStatusBadgeStyle = (statusVal) => {
    if (statusVal === "accepted") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (statusVal === "rejected") {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
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

        {/* CSV Export & Filters */}
        <div className="flex w-full md:w-auto items-center justify-end gap-3 shrink-0">
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

      {/* Main Table Grid */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4 pl-6 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredApplicants.length > 0 && filteredApplicants.every(item => selectedIds.has(item.id))}
                      onChange={() => toggleSelectAll(filteredApplicants)}
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
                {filteredApplicants.map((applicant) => {
                  return (
                    <tr 
                      key={applicant.id}
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Checkbox column */}
                      <td className="p-4 pl-6 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(applicant.id)}
                          onChange={() => toggleSelectOne(applicant.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                      </td>

                      {/* Photo + Name + Email */}
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
                            {applicant.role === "admin" && (
                              <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[8px] font-mono font-extrabold px-1 rounded-sm uppercase tracking-wider">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{applicant.email}</div>
                          {applicant.memberId && applicant.memberId !== "PENDING" && (
                            <div className="text-[10px] font-mono text-cyan-500 mt-0.5 font-semibold">
                              {applicant.memberId}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Year / Branch */}
                      <td className="p-4 text-xs">
                        <div className="text-gray-300 font-medium">{applicant.year} Year</div>
                        <div className="text-gray-500 font-mono mt-0.5">{applicant.branch}</div>
                      </td>

                      {/* Interests */}
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-[#18181b] border border-white/[0.04] text-[10px] font-mono text-cyan-300 uppercase tracking-wide">
                          {applicant.interests || "General"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(applicant.status)}`}>
                          {applicant.status || "pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right space-x-2 shrink-0">
                        {/* Detail Modal Trigger */}
                        <button
                          onClick={() => setSelectedApplicant(applicant)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-orbitron font-bold rounded tracking-wider border border-slate-700 transition-colors"
                        >
                          DETAILS
                        </button>
                        
                        {/* State transitions */}
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
                            className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                          >
                            REJECT
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
        />
      )}

      {/* Standalone Full-size Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setPreviewImageUrl(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />
          <div className="relative bg-[#111115] border border-white/[0.08] max-w-3xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200 z-10">
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
