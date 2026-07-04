"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { showAlert } from "@/lib/alert-store";

export default function MeetingsTab() {
    // DB states
    const [meetings, setMeetings] = useState([]);
    const [mails, setMails] = useState([]);
    const [points, setPoints] = useState({});
    
    // User lists from Supabase
    const [members, setMembers] = useState([]);
    
    // UI states
    const [activeSection, setActiveSection] = useState("meetings"); // "meetings" | "mails"
    const [selectedMeeting, setSelectedMeeting] = useState(null); // For attendance modal
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form inputs
    const [meetingForm, setMeetingForm] = useState({ title: "", date: "", time: "", description: "" });
    const [mailForm, setMailForm] = useState({ subject: "", body: "", target: "all" });
    
    // Points edit state for attendance logs
    const [pointChangeStates, setPointChangeStates] = useState({}); // { [userId]: { change: 5, reason: "" } }

    // Fetch initial DB and members
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch JSON DB
            const dbRes = await fetch("/api/secretary/db");
            const dbData = await dbRes.json();
            setMeetings(dbData.meetings || []);
            setMails(dbData.mails || []);
            setPoints(dbData.points || {});

            // 2. Fetch Club Members from Supabase
            const { data: dbMembers, error: memError } = await supabase
                .from("users")
                .select("uid, name, role, email, status")
                .eq("status", "accepted")
                .order("name", { ascending: true });

            if (memError) throw memError;
            setMembers(dbMembers || []);
            
            // Initialize point forms for each member
            const initialPointChanges = {};
            dbMembers?.forEach(m => {
                initialPointChanges[m.uid] = { change: 5, reason: "Active participation in meeting" };
            });
            setPointChangeStates(initialPointChanges);
        } catch (err) {
            console.error("Error loading data:", err);
            showAlert("Failed to load meetings database: " + err.message, "Load Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Create Meeting
    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        if (!meetingForm.title || !meetingForm.date || !meetingForm.time) {
            await showAlert("Please fill in meeting title, date, and time.", "Required Fields");
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch("/api/secretary/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "meeting",
                    action: "create",
                    data: meetingForm
                })
            });
            if (!res.ok) throw new Error("Failed to create meeting.");
            const resJson = await res.json();
            setMeetings(resJson.db.meetings);
            setMeetingForm({ title: "", date: "", time: "", description: "" });
            await showAlert("New meeting scheduled successfully!", "Success");
        } catch (err) {
            await showAlert(err.message, "Error");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Meeting
    const handleDeleteMeeting = async (meetingId) => {
        if (!confirm("Are you sure you want to delete this meeting?")) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/secretary/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "meeting",
                    action: "delete",
                    data: { id: meetingId }
                })
            });
            if (!res.ok) throw new Error("Failed to delete meeting.");
            const resJson = await res.json();
            setMeetings(resJson.db.meetings);
        } catch (err) {
            await showAlert(err.message, "Error");
        } finally {
            setActionLoading(false);
        }
    };

    // Compose Announcement Mail
    const handleSendMail = async (e) => {
        e.preventDefault();
        if (!mailForm.subject || !mailForm.body) {
            await showAlert("Subject and Body are required.", "Required Fields");
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch("/api/secretary/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "mail",
                    action: "send",
                    data: mailForm
                })
            });
            if (!res.ok) throw new Error("Failed to publish announcement.");
            const resJson = await res.json();
            setMails(resJson.db.mails);
            setMailForm({ subject: "", body: "", target: "all" });
            await showAlert("Announcement published to member portals!", "Success");
        } catch (err) {
            await showAlert(err.message, "Error");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Announcement Mail
    const handleDeleteMail = async (mailId) => {
        if (!confirm("Delete this announcement?")) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/secretary/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "mail",
                    action: "delete",
                    data: { id: mailId }
                })
            });
            if (!res.ok) throw new Error("Failed to delete announcement.");
            const resJson = await res.json();
            setMails(resJson.db.mails);
        } catch (err) {
            await showAlert(err.message, "Error");
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle Attendance Checkbox
    const handleToggleAttendance = async (userId, attended) => {
        if (!selectedMeeting) return;
        const currentAttendance = selectedMeeting.attendance || [];
        let updatedAttendance;
        if (attended) {
            updatedAttendance = [...currentAttendance.filter(id => id !== userId), userId];
        } else {
            updatedAttendance = currentAttendance.filter(id => id !== userId);
        }

        // Optimistically update UI
        const updatedMeeting = { ...selectedMeeting, attendance: updatedAttendance };
        setSelectedMeeting(updatedMeeting);
        setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));

        try {
            await fetch("/api/secretary/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "meeting",
                    action: "update-attendance",
                    data: {
                        meetingId: selectedMeeting.id,
                        attendanceList: updatedAttendance
                    }
                })
            });
        } catch (err) {
            console.error("Attendance update error:", err);
        }
    };

    // Apply Points Change
    const handleUpdatePoints = async (userId, pointsChange, reason) => {
        if (!reason) {
            await showAlert("Please enter a reason for the points adjustment.", "Reason Required");
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch("/api/secretary/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "points",
                    action: "update",
                    data: {
                        userId,
                        pointsChange,
                        reason
                    }
                })
            });
            if (!res.ok) throw new Error("Failed to update points.");
            const resJson = await res.json();
            setPoints(resJson.db.points);
            
            // Clear input reason
            setPointChangeStates(prev => ({
                ...prev,
                [userId]: { ...prev[userId], reason: "Active participation in meeting" }
            }));
            
            await showAlert(`Successfully adjusted user points!`, "Points Adjusted");
        } catch (err) {
            await showAlert(err.message, "Error");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 italic">Accessing Secretary records...</div>;

    return (
        <div className="mb-10 font-inter">
            {/* Header Switcher */}
            <div className="flex gap-4 mb-6 border-b border-slate-800 pb-4">
                <button
                    onClick={() => { setSelectedMeeting(null); setActiveSection("meetings"); }}
                    className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                        activeSection === "meetings" && !selectedMeeting
                            ? "bg-purple-600/30 text-purple-400 border border-purple-600/50"
                            : "glass-card text-slate-400 hover:text-white"
                    }`}
                >
                    📅 MANAGE MEETINGS
                </button>
                <button
                    onClick={() => { setSelectedMeeting(null); setActiveSection("mails"); }}
                    className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                        activeSection === "mails"
                            ? "bg-purple-600/30 text-purple-400 border border-purple-600/50"
                            : "glass-card text-slate-400 hover:text-white"
                    }`}
                >
                    ✉️ CLUB ANNOUNCEMENTS (MAILS)
                </button>
            </div>

            {/* SECTION 1: MEETING ATTENDANCE MODAL/SUBPANEL */}
            {selectedMeeting && (
                <div className="glass-card p-6 mb-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
                        <div>
                            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">HOSTING MEETING DETAILS</span>
                            <h3 className="text-xl font-bold text-white mt-1">{selectedMeeting.title}</h3>
                            <p className="text-xs text-slate-400">{selectedMeeting.date} @ {selectedMeeting.time}</p>
                        </div>
                        <button
                            onClick={() => setSelectedMeeting(null)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded text-xs font-bold transition-all"
                        >
                            ← BACK TO LIST
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th>MEMBER</th>
                                    <th>ROLE</th>
                                    <th>ATTENDANCE</th>
                                    <th>CURRENT POINTS</th>
                                    <th>ADJUST ATTENDANCE POINTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(member => {
                                    const isAttended = selectedMeeting.attendance?.includes(member.uid) || false;
                                    const memberPoints = points[member.uid]?.total || 0;
                                    const editState = pointChangeStates[member.uid] || { change: 5, reason: "" };

                                    return (
                                        <tr key={member.uid}>
                                            <td>
                                                <div className="font-bold text-white">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.email}</div>
                                            </td>
                                            <td>
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                                                    {member.role?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAttended}
                                                        onChange={(e) => handleToggleAttendance(member.uid, e.target.checked)}
                                                        className="w-4 h-4 accent-purple-600 rounded bg-slate-950"
                                                    />
                                                    <span className={`text-xs font-bold ${isAttended ? 'text-green-400' : 'text-slate-500'}`}>
                                                        {isAttended ? 'ATTENDED' : 'ABSENT'}
                                                    </span>
                                                </label>
                                            </td>
                                            <td>
                                                <span className={`font-mono font-bold text-sm ${memberPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {memberPoints >= 0 ? `+${memberPoints}` : memberPoints} pts
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap items-center gap-2 max-w-lg">
                                                    {/* Select quick adjustment points */}
                                                    <select
                                                        value={editState.change}
                                                        onChange={(e) => setPointChangeStates({
                                                            ...pointChangeStates,
                                                            [member.uid]: { ...editState, change: parseInt(e.target.value) }
                                                        })}
                                                        className="px-2 py-1 text-xs text-white bg-slate-950 border border-slate-800 rounded outline-none"
                                                    >
                                                        <option value="5">+5 pts (Active Leader)</option>
                                                        <option value="2">+2 pts (Regular Attendance)</option>
                                                        <option value="-2">-2 pts (Late/Disturbance)</option>
                                                        <option value="-5">-5 pts (Unexcused Absence)</option>
                                                    </select>

                                                    {/* Custom adjustment reason */}
                                                    <input
                                                        type="text"
                                                        placeholder="Reason for adjustment"
                                                        value={editState.reason}
                                                        onChange={(e) => setPointChangeStates({
                                                            ...pointChangeStates,
                                                            [member.uid]: { ...editState, reason: e.target.value }
                                                        })}
                                                        className="px-2 py-1 text-xs text-white bg-slate-950 border border-slate-800 rounded outline-none max-w-xs flex-grow"
                                                    />

                                                    {/* Apply points submit button */}
                                                    <button
                                                        onClick={() => handleUpdatePoints(member.uid, editState.change, editState.reason)}
                                                        disabled={actionLoading}
                                                        className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-all"
                                                    >
                                                        APPLY
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SECTION 2: HOST MEETINGS LIST */}
            {activeSection === "meetings" && !selectedMeeting && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Schedule Form */}
                    <div className="glass-card p-6 h-fit">
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700 pb-2">
                            SCHEDULE NEW MEETING
                        </h3>
                        <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">MEETING TITLE</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Weekly Prototyping Review"
                                    value={meetingForm.title}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                    className="w-full px-3 py-2 text-white rounded bg-slate-950 border border-slate-800"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-bold mb-1">DATE</label>
                                    <input
                                        type="date"
                                        value={meetingForm.date}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                                        className="w-full px-3 py-2 text-white rounded bg-slate-950 border border-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-bold mb-1">TIME</label>
                                    <input
                                        type="time"
                                        value={meetingForm.time}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                                        className="w-full px-3 py-2 text-white rounded bg-slate-950 border border-slate-800"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">MEETING DESCRIPTION</label>
                                <textarea
                                    rows="3"
                                    placeholder="Outline what needs to be discussed..."
                                    value={meetingForm.description}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                                    className="w-full px-3 py-2 text-white rounded bg-slate-950 border border-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded font-bold transition-all shadow-md"
                            >
                                SCHEDULE MEETING
                            </button>
                        </form>
                    </div>

                    {/* Scheduled Meetings List */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700 pb-2">
                            SCHEDULED MEETINGS
                        </h3>
                        {meetings.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 italic">No meetings hosted yet.</div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {meetings.map(m => (
                                    <div key={m.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all">
                                        <div className="max-w-xl">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs px-2 py-0.5 bg-purple-600/10 text-purple-400 border border-purple-600/30 rounded font-bold font-mono">
                                                    📅 {m.date}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded font-mono">
                                                    🕒 {m.time}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-bold text-white mt-2.5">{m.title}</h4>
                                            {m.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.description}</p>}
                                            <div className="text-xs font-bold text-slate-500 mt-2 font-mono">
                                                ATTENDANCE: {m.attendance?.length || 0} members marked
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedMeeting(m)}
                                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-all"
                                            >
                                                ATTENDANCE & POINTS
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMeeting(m.id)}
                                                className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600/30 border border-red-600/30 text-red-500 rounded text-xs font-bold transition-all"
                                            >
                                                REMOVE
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SECTION 3: CLUB MAILS ANNOUNCEMENTS */}
            {activeSection === "mails" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Compose Mail Form */}
                    <div className="glass-card p-6 h-fit">
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700 pb-2">
                            COMPOSE ANNOUNCEMENT (MAIL)
                        </h3>
                        <form onSubmit={handleSendMail} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">TARGET AUDIENCE</label>
                                <select
                                    value={mailForm.target}
                                    onChange={(e) => setMailForm({ ...mailForm, target: e.target.value })}
                                    className="w-full px-3 py-2 text-white rounded bg-slate-950 border border-slate-800"
                                >
                                    <option value="all">All Club Members</option>
                                    <option value="technical">Technical Team Only</option>
                                    <option value="ops">Operations Team Only</option>
                                    <option value="data">Data Team Only</option>
                                    <option value="secretary">Secretary Staff Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">SUBJECT</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Preparation for TechTorque 2026"
                                    value={mailForm.subject}
                                    onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
                                    className="w-full px-3 py-2 text-white rounded bg-slate-950 border border-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">BODY CONTENT</label>
                                <textarea
                                    rows="5"
                                    placeholder="Compose announcement body..."
                                    value={mailForm.body}
                                    onChange={(e) => setMailForm({ ...mailForm, body: e.target.value })}
                                    className="w-full px-3 py-2 text-white rounded bg-slate-950 border border-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded font-bold transition-all shadow-md"
                            >
                                PUBLISH ANNOUNCEMENT
                            </button>
                        </form>
                    </div>

                    {/* Announcement History List */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700 pb-2">
                            ANNOUNCEMENTS LOG
                        </h3>
                        {mails.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 italic">No announcements published yet.</div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {mails.map(mail => (
                                    <div key={mail.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all">
                                        <div className="max-w-xl">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs px-2 py-0.5 bg-orange-600/10 text-orange-400 border border-orange-600/30 rounded font-bold font-mono">
                                                    📢 {mail.date}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded font-bold font-mono uppercase">
                                                    TARGET: {mail.target}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-bold text-white mt-2.5">{mail.subject}</h4>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap">{mail.body}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteMail(mail.id)}
                                            className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600/30 border border-red-600/30 text-red-500 rounded text-xs font-bold transition-all"
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
