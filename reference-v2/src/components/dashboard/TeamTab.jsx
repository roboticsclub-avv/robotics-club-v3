"use client";

import React, { useState, useEffect } from "react";
import { fetchApplicants } from "@/lib/firebase/dashboardService";
import ApplicantDetailModal from "./ApplicantDetailModal";

export default function TeamTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  // Image preview state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  async function loadMembers() {
    try {
      setLoading(true);
      const data = await fetchApplicants();
      // Filter for accepted members only
      const acceptedMembers = data.filter((u) => u.status === "accepted");
      setMembers(acceptedMembers);
      setError(null);
    } catch (err) {
      console.error("Error loading team members:", err);
      setError("Failed to load team list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers();
  }, []);

  // Filter & Search logic
  const filteredMembers = members.filter((m) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = m.name ? m.name.toLowerCase().includes(query) : false;
    const emailMatch = m.email ? m.email.toLowerCase().includes(query) : false;
    const branchMatch = m.branch ? m.branch.toLowerCase().includes(query) : false;
    const memberIdMatch = m.memberId ? m.memberId.toLowerCase().includes(query) : false;

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
    const smartIdMatch = m.memberId ? m.memberId.toLowerCase().includes(searchId) : false;

    return nameMatch || emailMatch || branchMatch || memberIdMatch || smartIdMatch;
  });

  return (
    <div className="space-y-6 font-inter">
      {/* Header bar / Search */}
      <div className="bg-[#111115] border border-white/[0.04] p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="font-orbitron text-sm font-bold text-gray-400 tracking-wider">
          MEMBERS COUNT: {members.length}
        </h2>
        
        {/* Search */}
        <div className="w-full sm:w-80 relative">
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
      </div>

      {/* Members Grid / Table */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-mono text-sm">
            &gt; Syncing roster...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 font-mono text-sm">
            &gt; ERROR: {error}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic text-sm">
            No accepted members matching current search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4 pl-6">Member ID</th>
                  <th className="p-4">Profile</th>
                  <th className="p-4">Year / Branch</th>
                  <th className="p-4">Primary Interest</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredMembers.map((member) => (
                  <tr 
                    key={member.id}
                    className="hover:bg-white/[0.01] transition-colors"
                  >
                    {/* ID */}
                    <td className="p-4 pl-6 font-mono text-cyan-400 text-xs font-bold">
                      {member.memberId || "PENDING"}
                    </td>

                    {/* Name + Email + Photo */}
                    <td className="p-4 flex items-center gap-3">
                      <div 
                        onClick={() => setPreviewImageUrl(member.photoURL)}
                        title="Click to view full size photo"
                        className="w-10 h-10 rounded-full border border-white/[0.1] bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                      >
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={`${member.name}'s photo`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                              e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-semibold text-xs">${(member.name || "M")[0].toUpperCase()}</div>`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-cyan-400 font-orbitron font-semibold text-xs">
                            {(member.name || "M")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{member.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{member.email}</div>
                      </div>
                    </td>

                    {/* Year/Branch */}
                    <td className="p-4 text-xs">
                      <div className="text-gray-300 font-medium">{member.year} Year</div>
                      <div className="text-gray-500 font-mono mt-0.5">{member.branch}</div>
                    </td>

                    {/* Interest */}
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-[#18181b] border border-white/[0.04] text-[10px] font-mono text-cyan-300 uppercase tracking-wide">
                        {member.interests || "General"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-orbitron font-bold rounded tracking-wider border border-slate-700 transition-colors"
                      >
                        VIEW PROFILE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Profile Modal */}
      {selectedMember && (
        <ApplicantDetailModal
          applicant={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdateApplicant={(updatedMember) => {
            setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
            setSelectedMember(updatedMember);
          }}
        />
      )}

      {/* Image Preview Overlay Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setPreviewImageUrl(null)}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <div className="relative z-10 bg-[#111115] border border-white/[0.08] max-w-3xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
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
