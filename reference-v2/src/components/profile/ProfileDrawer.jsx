"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { formatDate } from "@/utils/formatters";
import DigitalMemberQR from "./DigitalMemberQR";
import ProfileHardwareSection from "./ProfileHardwareSection";
import ProfileAttendanceHistory from "./ProfileAttendanceHistory";

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, profile, logout } = useAuth();

  // Active Internal Tab: "overview" | "qr" | "edit" | "password" | "hardware"
  const [activeTab, setActiveTab] = useState("overview");

  // User Allocations State
  const [allocations, setAllocations] = useState([]);
  const [loadingHardware, setLoadingHardware] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  // Profile Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    branch: "",
    year: "",
    section: "",
    interests: "",
    reason: "",
    photoURL: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape Key Dismissal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Load Profile & Allocations
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
        photoURL: profile.photoURL || "",
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
      console.error("[ProfileDrawer] Error fetching hardware:", err);
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

      // System protected fields (memberId, roll_number, role, status, qr_token) are excluded from update payload
      const updatePayload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        branch: editForm.branch.trim(),
        year: editForm.year.trim(),
        section: editForm.section.trim(),
        interests: editForm.interests.trim(),
        reason: editForm.reason.trim(),
        photoURL: finalPhoto,
      };

      const { error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("uid", user.id);

      if (error) throw error;

      if (profile) {
        Object.assign(profile, updatePayload);
      }

      setActionMsg("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Failed to update profile: " + (err.message || err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg("");

    if (newPassword.length < 6) {
      setPassMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg("Passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPassMsg("✓ Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update error:", err);
      setPassMsg("Failed to update password: " + (err.message || err));
    } finally {
      setChangingPassword(false);
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
  const rcMemberId = profile.memberId || profile.member_id || "RC-MEMBER";
  
  const getRollNumber = () => {
    if (profile.roll_number) return profile.roll_number;
    if (profile.email && profile.email.toLowerCase().startsWith("av.")) {
      return profile.email.split("@")[0].toUpperCase();
    }
    return "NOT ASSIGNED";
  };
  const rollNumber = getRollNumber();

  return (
    <>
      {/* Dimmed Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 animate-fade-in"
      />

      {/* Right-Side Profile Drawer (Desktop) & Responsive Sheet (Mobile) */}
      <aside className="fixed top-16 md:top-[76px] bottom-0 right-0 left-0 md:left-auto md:w-[460px] bg-[var(--bg-primary)] border-l border-[var(--border-card)] z-[9999] shadow-2xl flex flex-col justify-between overflow-hidden font-inter transition-all duration-300 ease-out animate-slide-in-right">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-purple-glow)] border border-[var(--accent-purple)]/40 flex items-center justify-center font-orbitron text-[var(--accent-purple)] font-black text-sm">
              R
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-xs sm:text-sm text-[var(--text-primary)] tracking-wider uppercase">
                MEMBER ACCOUNT CENTER
              </h2>
              <p className="text-[10px] font-mono text-[var(--text-muted)]">
                Digital RC Identity & Settings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] flex items-center justify-center transition-all"
            aria-label="Close Profile Drawer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* DIGITAL RC IDENTITY BADGE HEADER */}
          <div className="glass-card rounded-3xl p-5 border-[var(--border-card)] space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-purple-glow)] rounded-full blur-2xl pointer-events-none opacity-50" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border-2 border-[var(--accent-purple)] flex items-center justify-center shadow-lg">
                  {profile.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photoURL}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black font-orbitron text-[var(--accent-purple)]">
                      {profile.name ? profile.name[0].toUpperCase() : "R"}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--bg-primary)]" title="Active Account" />
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-lg font-extrabold text-[var(--text-primary)] font-orbitron tracking-wide truncate">
                  {profile.name || "Club Member"}
                </h3>
                
                <p className="text-xs text-[var(--accent-purple)] font-mono font-semibold truncate">
                  {teamName}
                </p>

                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                    Status: {profile.status || "Accepted"}
                  </span>
                  <span>Role: <strong className="text-[var(--text-primary)] uppercase">{profile.role || "member"}</strong></span>
                </div>
              </div>
            </div>

            {/* Visual Identity Row: Distinct RC ID & Roll Number */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono relative z-10">
              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-card)]">
                <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                  RC MEMBER ID
                </span>
                <span className="text-[var(--accent-purple)] font-bold truncate block">
                  {rcMemberId}
                </span>
              </div>

              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-card)]">
                <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                  UNIVERSITY ROLL NO.
                </span>
                <span className="text-[var(--accent-orange)] font-bold truncate block">
                  {rollNumber}
                </span>
              </div>
            </div>
          </div>

          {actionMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono text-center">
              {actionMsg}
            </div>
          )}

          {/* Quick Sub-Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-orbitron">
            {[
              { id: "overview", label: "OVERVIEW" },
              { id: "qr", label: "DIGITAL QR" },
              { id: "edit", label: "EDIT PROFILE" },
              { id: "password", label: "PASSWORD" },
              { id: "hardware", label: "HARDWARE" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--accent-purple)] text-[var(--bg-primary)] border-[var(--accent-purple)] font-bold"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SUB-VIEW 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">College Email (Read-Only)</span>
                  <span className="text-[var(--text-primary)] font-semibold truncate block" title={profile.email}>
                    {profile.email}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">Phone Number</span>
                  <span className="text-[var(--text-primary)]">{profile.phone || "Not set"}</span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">Branch & Year</span>
                  <span className="text-[var(--text-primary)]">{profile.branch || "AIE"} ({profile.year || "Year 1"})</span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">Section</span>
                  <span className="text-[var(--text-primary)]">Section {profile.section || "A"}</span>
                </div>
              </div>

              {profile.interests && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs font-mono">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold mb-1">Focus / Research Interests</span>
                  <span className="text-[var(--text-primary)]">{profile.interests}</span>
                </div>
              )}

              {/* Event Attendance Summary inside Overview */}
              <ProfileAttendanceHistory userId={user.id} />
            </div>
          )}

          {/* SUB-VIEW 2: DIGITAL MEMBER QR */}
          {activeTab === "qr" && (
            <DigitalMemberQR profile={profile} />
          )}

          {/* SUB-VIEW 3: EDIT PROFILE FORM */}
          {activeTab === "edit" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-inter">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <h4 className="font-orbitron font-bold text-xs text-[var(--accent-teal)] uppercase tracking-wider">
                  Update Personal Information
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                  System protected fields (Member ID, Roll No, Role, Status) cannot be edited.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-purple)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                      Branch / Department
                    </label>
                    <input
                      type="text"
                      value={editForm.branch}
                      onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                      Year of Study
                    </label>
                    <input
                      type="text"
                      value={editForm.year}
                      onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      value={editForm.section}
                      onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-purple)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-[var(--accent-purple-glow)] file:text-[var(--accent-purple)] hover:file:brightness-110 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                    Focus / Research Interests
                  </label>
                  <input
                    type="text"
                    value={editForm.interests}
                    onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-orbitron font-bold text-xs rounded-xl tracking-wider transition-all disabled:opacity-50"
                >
                  {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          )}

          {/* SUB-VIEW 4: CHANGE PASSWORD */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-inter">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <h4 className="font-orbitron font-bold text-xs text-[var(--accent-orange)] uppercase tracking-wider">
                  Change Account Password
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                  Secured via Supabase Auth password update mechanism.
                </p>
              </div>

              {passMsg && (
                <div className={`p-3 rounded-xl text-xs font-mono text-center ${
                  passMsg.includes("✓") 
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}>
                  {passMsg}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                    New Password (Min 6 Characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-orange)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-orange)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 bg-[var(--accent-orange)] hover:brightness-110 text-[var(--bg-primary)] font-orbitron font-bold text-xs rounded-xl tracking-wider transition-all disabled:opacity-50"
              >
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          )}

          {/* SUB-VIEW 5: HARDWARE ALLOCATIONS */}
          {activeTab === "hardware" && (
            <ProfileHardwareSection allocations={allocations} onRefresh={fetchUserHardware} />
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between shrink-0 font-inter">
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold font-mono transition-all"
          >
            Logout Account
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)] rounded-xl text-xs font-bold font-orbitron transition-all"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
