"use client";

import React, { useState, useEffect } from "react";
import { formatDate } from "@/utils/formatters";
import { updateAdminNotes, updateUserRole, deleteUser } from "@/lib/supabase/dashboardService";
import useAuth from "@/hooks/useAuth";

export default function ApplicantDetailModal({ applicant, onClose, onUpdateApplicant, onDeleteApplicant }) {
  console.log("[ApplicantDetailModal] Mounting with applicant:", applicant);
  const [notes, setNotes] = useState(applicant ? applicant.adminNotes || "" : "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const { isAdmin } = useAuth();
  const [selectedRole, setSelectedRole] = useState(applicant ? applicant.role || "member" : "member");
  const [savingRole, setSavingRole] = useState(false);

  // Sync role state when applicant changes
  useEffect(() => {
    if (applicant) {
      setSelectedRole(applicant.role || "member");
    }
  }, [applicant]);

  if (!applicant) return null;

  // Social Links helper
  const renderSocialLink = (label, url) => {
    if (url && url.trim().startsWith("http")) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 transition-colors underline font-mono text-xs break-all"
        >
          {url}
        </a>
      );
    }
    return <span className="text-gray-500 font-mono text-xs">Not Provided</span>;
  };

  // Safe formatting helpers
  const name = applicant.name || "N/A";
  const email = applicant.email || "N/A";
  const phone = applicant.phone || "Not Provided";
  const branch = applicant.branch || "N/A";
  const year = applicant.year || "N/A";
  const section = applicant.section || "N/A";
  const interests = applicant.interests || "N/A";
  const reason = applicant.reason || "No motivation statement provided.";
  const status = applicant.status || "pending";
  const photoURL = applicant.photoURL || null;
  const memberId = applicant.memberId || "PENDING";
  const role = applicant.role || "member";

  // Timeline events helper
  const submitDateStr = applicant.createdAt ? formatDate(applicant.createdAt) : "Date Unknown";
  const updateDateStr = applicant.statusUpdatedAt ? formatDate(applicant.statusUpdatedAt) : null;

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await updateAdminNotes(applicant.id, notes);
      alert("Admin notes saved successfully!");
      if (onUpdateApplicant) {
        onUpdateApplicant({ ...applicant, adminNotes: notes });
      }
    } catch (err) {
      console.error("Error saving notes:", err);
      alert(`Failed to save notes: ${err.message || err}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (newRole === selectedRole) return;
    const confirmChange = window.confirm(`Are you sure you want to change this member's role to ${newRole.toUpperCase()}?`);
    if (!confirmChange) return;

    try {
      setSavingRole(true);
      await updateUserRole(applicant.id, newRole);
      setSelectedRole(newRole);
      alert("Role updated successfully!");
      if (onUpdateApplicant) {
        onUpdateApplicant({ ...applicant, role: newRole });
      }
    } catch (err) {
      console.error("Error updating role:", err);
      alert(`Failed to update role: ${err.message || err}`);
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    const confirmDelete = window.confirm(
      `[SUPER ADMIN] Are you sure you want to permanently delete user "${name}" (${email})? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setSavingNotes(true);
      await deleteUser(applicant.id);
      alert(`User "${name}" deleted successfully.`);
      if (onDeleteApplicant) {
        onDeleteApplicant(applicant.id);
      }
      onClose();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(`Failed to delete user: ${err.message || err}`);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Main Modal Shell */}
      <div className="relative z-10 bg-[#111115] border border-white/[0.08] max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col font-inter">
        
        {/* Header */}
        <div className="bg-[#16161c] border-b border-white/[0.05] p-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Profile Avatar / Thumbnail */}
            <div 
              onClick={() => photoURL && setShowImagePreview(true)}
              className="w-14 h-14 rounded-full border border-cyan-500/30 bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.2)] group"
              title="Click to view fullsize image"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={`${name}'s photo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-bold text-lg">${name[0]}</div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-bold text-lg">
                  {name[0]}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white font-orbitron tracking-wide">{name}</h2>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  status === "accepted"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : status === "rejected"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-1">{email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* Assigned Member ID & Role Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Assigned Member ID</span>
                <span className="text-lg font-mono font-bold text-cyan-400 mt-1 block">{memberId}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs">
                #
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">System Role</span>
              {isAdmin ? (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={selectedRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={savingRole}
                    className="bg-black/60 border border-white/10 rounded px-2.5 py-1 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="member">member</option>
                    <option value="technical">technical</option>
                    <option value="ops">ops</option>
                    <option value="data">data</option>
                    <option value="secretary">secretary</option>
                    <option value="media">media</option>
                    <option value="it">it</option>
                    <option value="admin">admin</option>
                  </select>
                  {savingRole && <span className="text-[10px] font-mono text-cyan-400 animate-pulse">Saving...</span>}
                </div>
              ) : (
                <span className="text-sm font-mono text-gray-300 capitalize">{role}</span>
              )}
            </div>
          </div>

          {/* User Basic Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg text-xs">
            <div>
              <span className="text-gray-500 font-mono block">Academic Year</span>
              <span className="text-gray-200 font-bold mt-1 block">{year} Year</span>
            </div>
            <div>
              <span className="text-gray-500 font-mono block">Branch</span>
              <span className="text-gray-200 font-bold mt-1 block">{branch}</span>
            </div>
            <div>
              <span className="text-gray-500 font-mono block">Section</span>
              <span className="text-gray-200 font-bold mt-1 block">{section}</span>
            </div>
            <div>
              <span className="text-gray-500 font-mono block">Phone Number</span>
              <span className="text-gray-200 font-bold mt-1 block font-mono">{phone}</span>
            </div>
          </div>

          {/* Domain Interests & Reason */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Domain Interests</h3>
              <div className="flex flex-wrap gap-2">
                {interests.split(',').map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded-full text-xs text-cyan-300 font-mono">
                    {item.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statement of Motivation</h3>
              <div className="p-4 bg-black/40 border border-white/[0.04] rounded-lg text-sm text-gray-300 leading-relaxed font-inter whitespace-pre-wrap">
                {reason}
              </div>
            </div>
          </div>

          {/* Admin Internal Notes */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest block">
              Internal Admin Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add confidential recruitment notes or evaluation comments here..."
              className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg p-3 text-sm text-gray-300 placeholder-gray-600 transition-colors font-inter resize-y"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-orbitron font-bold text-xs rounded transition-colors"
              >
                {savingNotes ? "SAVING..." : "SAVE NOTES"}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#111115] border-t border-white/[0.05] p-4 flex justify-between items-center">
          <button
            onClick={handleDeleteUser}
            disabled={savingNotes}
            className="px-4 py-2 rounded-lg bg-red-950/40 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-orbitron font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            DELETE USER
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 hover:border-slate-600"
          >
            CLOSE DETAILS
          </button>
        </div>

      </div>

      {/* Image Preview Overlay Modal */}
      {showImagePreview && photoURL && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div 
            onClick={() => setShowImagePreview(false)}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <div className="relative z-10 bg-[#111115] border border-white/10 max-w-3xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-md hover:bg-black/90 text-white p-2 rounded-full border border-white/10 transition-colors z-20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={photoURL}
              alt={`${name}'s photo fullsize`}
              className="max-w-full max-h-[70vh] object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = `<div class="p-12 text-center text-gray-500 font-mono text-sm">Image failed to load.</div>`;
              }}
            />
            <div className="p-4 bg-black/40 text-center text-xs font-mono text-cyan-400 w-full border-t border-white/[0.05]">
              {name} {" // "} FULL-SIZE IMAGE PREVIEW
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
