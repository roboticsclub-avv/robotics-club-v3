"use client";

import React, { useState } from "react";
import { formatDate } from "@/utils/formatters";
import { updateAdminNotes } from "@/lib/firebase/dashboardService";

export default function ApplicantDetailModal({ applicant, onClose, onUpdateApplicant }) {
  console.log("[ApplicantDetailModal] Mounting with applicant:", applicant);
  const [notes, setNotes] = useState(applicant ? applicant.adminNotes || "" : "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Content - Glassmorphic, Animated */}
      <div className="relative z-10 bg-[#111115]/95 border border-white/[0.08] w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        
        {/* Header/Banner */}
        <div className="relative h-32 bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-slate-950/40 p-6 flex items-end border-b border-white/[0.05]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-white/[0.03] hover:bg-white/[0.08] p-2 rounded-full border border-white/[0.05]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setShowImagePreview(true)}
              title="Click to view fullsize profile image"
              className="w-20 h-20 rounded-full border-2 border-cyan-500 overflow-hidden bg-slate-800 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={`${name}'s photo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-bold text-xl">${name[0]}</div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-bold text-xl">
                  {name[0].toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="mb-1">
              <h2 className="text-2xl font-bold font-orbitron text-white tracking-wide">{name}</h2>
              <p className="text-xs text-gray-400 font-mono">
                {year} Year {" // "} {branch} {" // "} Section {section}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable details area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-8 font-inter">
          
          {/* Main Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Contact & Status */}
            <div className="space-y-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
              <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest border-b border-white/[0.05] pb-2">
                Applicant Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-300 font-medium break-all text-right">{email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-300 font-medium">{phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-gray-500">Interests</span>
                  <span className="text-cyan-400 font-mono text-xs">{interests}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Member ID</span>
                  <span className="text-purple-400 font-mono text-xs font-bold">{memberId}</span>
                </div>
              </div>
            </div>

            {/* Social Channels */}
            <div className="space-y-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
              <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest border-b border-white/[0.05] pb-2">
                Social Networks
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">GitHub</span>
                  {renderSocialLink("GitHub", applicant.githubUrl)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">LinkedIn</span>
                  {renderSocialLink("LinkedIn", applicant.linkedinUrl)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Portfolio</span>
                  {renderSocialLink("Portfolio", applicant.portfolioUrl)}
                </div>
              </div>
            </div>

          </div>

          {/* Motivation Statement */}
          <div className="space-y-3 bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
            <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest border-b border-white/[0.05] pb-2">
              Motivation Statement
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed italic whitespace-pre-wrap">
              &ldquo;{reason}&rdquo;
            </p>
          </div>

          {/* Admin Comments & Notes */}
          <div className="space-y-3 bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
            <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest border-b border-white/[0.05] pb-2">
              Admin Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record coordinator review notes or candidate feedback here..."
              rows={3}
              disabled={savingNotes}
              className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg p-3 text-sm text-gray-300 placeholder-gray-600 transition-colors font-inter resize-y"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-orbitron font-bold text-xs rounded transition-colors"
              >
                {savingNotes ? "SAVING NOTES..." : "SAVE NOTES"}
              </button>
            </div>
          </div>

          {/* Application Timeline */}
          <div className="space-y-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
            <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest border-b border-white/[0.05] pb-2">
              Application Activity Timeline
            </h3>
            
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700/50">
              
              {/* Event 1: Submitted */}
              <div className="relative">
                <span className="absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full bg-green-500 border border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Application Submitted</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{submitDateStr}</p>
                </div>
              </div>

              {/* Event 2: Pending Review */}
              <div className="relative">
                <span className="absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full bg-yellow-500 border border-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.4)]"></span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Pending Review</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Assigned to recruitment coordinators</p>
                </div>
              </div>

              {/* Event 3: Decision */}
              <div className="relative">
                <span className={`absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full border border-slate-900 ${
                  status === "accepted"
                    ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                    : status === "rejected"
                    ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    : "bg-slate-700"
                }`}></span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">
                    {status === "accepted" && "Status Updated: Accepted"}
                    {status === "rejected" && "Status Updated: Rejected"}
                    {status === "pending" && "Decision: Pending"}
                  </h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {status !== "pending" && updateDateStr ? updateDateStr : "Awaiting administrator decision"}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#111115] border-t border-white/[0.05] p-4 flex justify-end">
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
          <div className="relative z-10 bg-[#111115] border border-white/[0.08] max-w-3xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
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
