"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sendStatusNotification, initEmailJS } from "@/lib/email";
import { showAlert, showConfirm } from "@/lib/alert-store";

export default function ApplicantsTab() {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0 });

    const fetchApplicants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;

            const apps = (data || []).map(d => ({ ...d, id: d.uid }));
            let total = 0, pending = 0, accepted = 0;

            apps.forEach((data) => {
                total++;
                if (data.status === 'pending') pending++;
                if (data.status === 'accepted') accepted++;
            });

            apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setApplicants(apps);
            setStats({ total, pending, accepted });
        } catch (error) {
            console.error("Error fetching applicants:", error);
            await showAlert("Error loading data: " + error.message, "Fetch Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initEmailJS();
        fetchApplicants();
    }, []);

    // V3: Admin writes now go through secure API routes instead of direct Supabase client writes
    const getCallerToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    };

    const handleUpdateStatus = async (id, status) => {
        const isConfirmed = await showConfirm(`Mark this applicant as ${status.toUpperCase()}?`, "Status Update");
        if (!isConfirmed) return;
        try {
            const callerToken = await getCallerToken();
            if (!callerToken) throw new Error("Not authenticated. Please log in again.");

            const response = await fetch('/api/applicants/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId: id, status, callerToken }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'API request failed');

            const { memberId, user: userData } = result;

            // Send email notification via EmailJS (client-side is fine for email)
            if (userData?.email) {
                try {
                    await sendStatusNotification(
                        userData.email,
                        userData.name || 'Student',
                        memberId || userData.memberId || 'PENDING',
                        status,
                        userData.interests || 'General'
                    );
                    if (status === 'accepted') {
                        await showAlert(`User Accepted! New Member ID: ${memberId}`, "Application Approved");
                    } else {
                        await showAlert("User Rejected.", "Application Rejected");
                    }
                } catch (mailError) {
                    console.error("Mail Error:", mailError);
                    await showAlert("Status updated, but failed to send email. Ensure EmailJS keys are correct.", "Notification Error");
                }
            } else {
                await showAlert("Status updated, but user has no email for notification.", "Notification Error");
            }

            fetchApplicants();
        } catch (error) {
            console.error(error);
            await showAlert("Error updating status: " + error.message, "Status Update Error");
        }
    };

    const handleUpdateRole = async (id, role) => {
        const isConfirmed = await showConfirm(`Change user's role to ${role.toUpperCase()}?`, "Role Reassignment");
        if (!isConfirmed) return;
        try {
            const callerToken = await getCallerToken();
            if (!callerToken) throw new Error("Not authenticated. Please log in again.");

            const response = await fetch('/api/applicants/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId: id, role, callerToken }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'API request failed');

            await showAlert(`Role successfully updated to ${role.toUpperCase()}`, "Role Updated");
            fetchApplicants();
        } catch (error) {
            console.error(error);
            await showAlert("Error updating role: " + error.message, "Role Update Error");
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirm("Are you sure you want to PERMANENTLY DELETE this record? This cannot be undone.", "Delete Record");
        if (!isConfirmed) return;
        try {
            const callerToken = await getCallerToken();
            if (!callerToken) throw new Error("Not authenticated. Please log in again.");

            const response = await fetch('/api/applicants/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId: id, callerToken }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'API request failed');

            await showAlert("Record deleted.", "Record Deleted");
            fetchApplicants();
        } catch (error) {
            await showAlert("Error deleting: " + error.message, "Deletion Error");
        }
    };

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-bold mb-2">TOTAL APPLICANTS</h3>
                    <p className="text-4xl font-inter text-white">{stats.total}</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-bold mb-2">PENDING REVIEW</h3>
                    <p className="text-4xl font-inter text-yellow-400">{stats.pending}</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-bold mb-2">ACCEPTED</h3>
                    <p className="text-4xl font-inter text-green-400">{stats.accepted}</p>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Year / Branch</th>
                                <th className="p-4">Interest</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500 italic">Loading data...</td>
                                </tr>
                            ) : applicants.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">No applicants yet.</td>
                                </tr>
                            ) : (
                                applicants.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white flex items-center gap-2">
                                                {app.name || 'N/A'}
                                                {app.role === 'admin' && <span className="bg-purple-500 text-[10px] px-1 rounded">ADMIN</span>}
                                            </div>
                                            <div className="text-xs text-slate-400">{app.email || 'N/A'}</div>
                                            <div className="text-[10px] font-mono text-cyan-600">{app.memberId || ''}</div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div>{app.year || '-'}</div>
                                            <div className="text-slate-400">{app.branch || '-'} ({app.section || '-'})</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded text-xs font-mono bg-slate-700 text-cyan-300 border border-cyan-500/30">
                                                {app.interests || '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300 max-w-xs truncate" title={app.reason}>
                                            {app.reason || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${app.status === 'accepted' ? 'text-green-400 bg-green-400/10' :
                                                app.status === 'rejected' ? 'text-red-400 bg-red-400/10' :
                                                    'text-yellow-400 bg-yellow-400/10'
                                                }`}>
                                                {app.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {app.status === 'accepted' ? (
                                                <select
                                                    value={app.role || 'member'}
                                                    onChange={(e) => handleUpdateRole(app.id, e.target.value)}
                                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-400 capitalize"
                                                >
                                                    <option value="member">member</option>
                                                    <option value="technical">technical</option>
                                                    <option value="ops">ops</option>
                                                    <option value="data">data</option>
                                                    <option value="secretary">secretary</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            ) : (
                                                <span className="text-xs text-slate-500 font-mono capitalize">
                                                    {app.role || 'applicant'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            {app.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(app.id, 'accepted')} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded font-bold transition-colors">ACCEPT</button>
                                                    <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded font-bold transition-colors">REJECT</button>
                                                </>
                                            )}
                                            {app.status === 'rejected' && (
                                                <button onClick={() => handleDelete(app.id)} className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded font-bold transition-colors border border-slate-500">DELETE</button>
                                            )}
                                            {app.status === 'accepted' && (
                                                <button onClick={() => handleDelete(app.id)} className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded font-bold transition-colors border border-slate-500">REMOVE</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
