"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { formatDate } from "@/utils/formatters";
import CountdownWidget from "@/components/requisition/CountdownWidget";

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, profile, logout } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [loadingHardware, setLoadingHardware] = useState(false);
  const [extendingId, setExtendingId] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [actionMsg, setActionMsg] = useState("");

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    branch: "",
    year: "",
    section: "",
    interests: "",
    reason: "",
    photoURL: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserHardware();
    }
    if (profile) {
      setEditForm({
        name: profile.name || "",
        phone: profile.phone || "",
        branch: profile.branch || "",
        year: profile.year || "",
        section: profile.section || "",
        interests: profile.interests || "",
        reason: profile.reason || "",
        photoURL: profile.photoURL || ""
      });
    }
  }, [isOpen, user, profile]);

  const fetchUserHardware = async () => {
    if (!user) return;
    setLoadingHardware(true);
    try {
      const { data, error } = await supabase
        .from("allocations")
        .select("*")
        .eq("userId", user.id);

      if (!error && data) {
        const sorted = data.sort((a, b) => {
          if (a.status === b.status) {
            return new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0);
          }
          return a.status === "issued" || a.status === "extended" ? -1 : 1;
        });
        setAllocations(sorted);
      }
    } catch (err) {
      console.error("[UserProfileModal] Error fetching allocations:", err);
    } finally {
      setLoadingHardware(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setActionMsg("");
    try {
      let finalPhoto = editForm.photoURL;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('applicants')
          .upload(fileName, selectedFile, { upsert: true });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('applicants')
            .getPublicUrl(fileName);
          finalPhoto = publicUrlData.publicUrl;
        }
      }

      const updatePayload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        branch: editForm.branch.trim(),
        year: editForm.year.trim(),
        section: editForm.section.trim(),
        interests: editForm.interests.trim(),
        reason: editForm.reason.trim(),
        photoURL: finalPhoto
      };

      const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('uid', user.id);

      if (error) throw error;

      // Update local profile object directly
      Object.assign(profile, updatePayload);
      setActionMsg("Your profile was updated successfully!");
      setIsEditingProfile(false);
    } catch (err) {
      const errMsg = err?.message || err?.error_description || (typeof err === "string" ? err : JSON.stringify(err)) || "Profile update failed.";
      console.error("Profile update failed:", errMsg, err);
      alert("Failed to update profile: " + errMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExtendHardware = async (allocationId, currentExpectedReturn) => {
    try {
      setExtendingId(allocationId);
      setActionMsg("");

      const baseDate = currentExpectedReturn ? new Date(currentExpectedReturn) : new Date();
      baseDate.setDate(baseDate.getDate() + parseInt(extendDays || 7, 10));
      const newReturnStr = baseDate.toISOString().split("T")[0];

      const { error } = await supabase
        .from("allocations")
        .update({
          expectedReturn: newReturnStr,
          status: "extended"
        })
        .eq("id", allocationId);

      if (error) throw error;

      setActionMsg(`Hardware return date extended to ${formatDate(newReturnStr)}!`);
      await fetchUserHardware();
    } catch (err) {
      console.error("[UserProfileModal] Error extending return date:", err);
      alert(`Failed to extend return date: ${err.message || err}`);
    } finally {
      setExtendingId(null);
    }
  };

  if (!isOpen || !profile) return null;

  const getTeamName = (userRole, branchName) => {
    const r = (userRole || "").toLowerCase();
    if (r === "admin") return "Executive Directorate";
    if (r === "technical") return "Technical Core";
    if (r === "ops") return "Operations & Logistics";
    if (r === "data") return "Data & Systems";
    if (r === "secretary") return "Executive Secretariat";
    if (r === "media") return "Media & Design";
    if (r === "it") return "IT Systems Core";
    return `${branchName || 'Robotics'} Engineering Team`;
  };

  const teamName = getTeamName(profile.role, profile.branch);
  const submitDateStr = profile.createdAt ? formatDate(profile.createdAt) : "Active Member";
  const memberIdDisplay = profile.memberId || "RC-MEMBER";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-inter animate-fade-in">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Glow backdrop decorative effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full bg-white/[0.04] border border-white/10 transition-all hover:scale-110"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* ── HEADER: User Profile Card ── */}
        <div className="flex items-center gap-5 pt-2 border-b border-white/[0.08] pb-6 relative z-10">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-cyan-500/30 flex items-center justify-center shadow-lg">
              {profile.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoURL}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span className="text-2xl font-black font-orbitron text-cyan-400">
                  {profile.name ? profile.name[0].toUpperCase() : "R"}
                </span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0f172a]" title="Active Status" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white font-orbitron tracking-wide truncate">
                {profile.name || "Club Member"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                {memberIdDisplay}
              </span>
            </div>

            <p className="text-xs text-purple-400 font-mono font-semibold">
              {teamName}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono flex-wrap">
              <span>Joined: {submitDateStr}</span>
              <span>•</span>
              <span className="capitalize text-gray-300">Role: <strong className="text-white uppercase">{profile.role || "member"}</strong></span>
            </div>
          </div>

          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition-all shrink-0"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {actionMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono text-center">
            {actionMsg}
          </div>
        )}

        {/* ── EDIT PROFILE FORM MODE ── */}
        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 relative z-10 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h3 className="font-orbitron font-bold text-sm text-cyan-400 uppercase tracking-wider">
                Edit Personal Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                  Branch / Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. AIE, CSE, ECE"
                  value={editForm.branch}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                  Year of Study
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1st Year, 2nd Year"
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                  Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. A, B, C"
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                  Update Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                Research / Focus Interests
              </label>
              <input
                type="text"
                placeholder="e.g. Embedded Systems, ROS, Machine Learning"
                value={editForm.interests}
                onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-mono rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-mono font-bold rounded-xl transition disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* ── DETAILS GRID ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10 text-xs">
              <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                <span className="text-[10px] font-mono text-gray-400 uppercase block mb-0.5">Email</span>
                <span className="text-white font-mono truncate block" title={profile.email}>{profile.email}</span>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                <span className="text-[10px] font-mono text-gray-400 uppercase block mb-0.5">Phone Number</span>
                <span className="text-white font-mono block">{profile.phone || "Not set"}</span>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                <span className="text-[10px] font-mono text-gray-400 uppercase block mb-0.5">Branch / Year</span>
                <span className="text-white font-mono block">{profile.branch || "AIE"} ({profile.year || "Year 1"})</span>
              </div>
            </div>

            {/* ── HARDWARE BORROWING & COUNTDOWN SECTION ── */}
            <div className="space-y-4 pt-2 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <span>🔧</span> My Borrowed Hardware ({allocations.filter(a => a.status !== "returned").length})
                </h3>
                <button
                  onClick={fetchUserHardware}
                  className="text-[10px] text-gray-400 hover:text-white transition font-mono"
                >
                  🔄 Refresh
                </button>
              </div>

              {loadingHardware ? (
                <div className="py-6 text-center text-xs text-gray-400 font-mono animate-pulse">
                  Loading allocated hardware stocks...
                </div>
              ) : allocations.filter(a => a.status !== "returned").length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center text-xs text-gray-400 font-mono">
                  No hardware components currently issued to your account.
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {allocations
                    .filter((a) => a.status !== "returned")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 hover:border-cyan-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {item.itemName || item.item_name || "Hardware Component"}
                            </h4>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                              Issued: {formatDate(item.issuedAt || item.issued_at)}
                            </p>
                          </div>

                          <CountdownWidget
                            returnDate={item.expectedReturn || item.expected_return}
                            status={item.status}
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-white/[0.05] pt-3 text-xs font-mono">
                          <span className="text-gray-400">
                            Target Return: <strong className="text-white">{formatDate(item.expectedReturn || item.expected_return)}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            <select
                              value={extendDays}
                              onChange={(e) => setExtendDays(e.target.value)}
                              className="bg-black/50 border border-white/10 text-white rounded px-2 py-1 text-[11px]"
                            >
                              <option value="3">+3 Days</option>
                              <option value="7">+7 Days</option>
                              <option value="14">+14 Days</option>
                            </select>

                            <button
                              onClick={() => handleExtendHardware(item.id, item.expectedReturn || item.expected_return)}
                              disabled={extendingId === item.id}
                              className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/60 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            >
                              {extendingId === item.id ? "Extending..." : "Extend Return"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── FOOTER ACTIONS ── */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 relative z-10">
          <button
            onClick={logout}
            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold font-mono transition-all"
          >
            Logout Account
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/10 rounded-xl text-xs font-bold font-orbitron transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

