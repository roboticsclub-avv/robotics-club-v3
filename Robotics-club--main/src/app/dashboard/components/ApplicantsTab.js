"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sendStatusNotification, initEmailJS } from "@/lib/email";

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
            alert("Error loading data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initEmailJS();
        fetchApplicants();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        if (!confirm(`Mark this applicant as ${status.toUpperCase()}?`)) return;
        try {
            const updates = { status };
            let memberId = null;

            if (status === 'accepted') {
                memberId = 'RC-' + Math.floor(1000 + Math.random() * 9000);
                updates.memberId = memberId;
                updates.role = 'member';
            }

            const { data: userDataList, error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('uid', id)
                .select();

            if (updateError) throw updateError;
            const userData = userDataList?.[0];

            if (userData && userData.email) {
                try {
                    await sendStatusNotification(
                        userData.email,
                        userData.name || 'Student',
                        memberId || userData.memberId || 'PENDING',
                        status,
                        userData.interests || 'General'
                    );
                    if (status === 'accepted') alert(`User Accepted! New Member ID: ${memberId}`);
                    else alert(`User Rejected.`);
                } catch (mailError) {
                    console.error("Mail Error:", mailError);
                    alert("Status updated, but failed to send email. Ensure EmailJS keys are correct.");
                }
            } else {
                alert("Status updated, but user has no email for notification.");
            }

            fetchApplicants();
        } catch (error) {
            console.error(error);
            alert("Error updating status: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to PERMANENTLY DELETE this record? This cannot be undone.")) return;
        try {
            const { error } = await supabase.from('users').delete().eq('uid', id);
            if (error) throw error;
            alert("Record deleted.");
            fetchApplicants();
        } catch (error) {
            alert("Error deleting: " + error.message);
        }
    };

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-bold mb-2">TOTAL APPLICANTS</h3>
                    <p className="text-4xl font-orbitron text-white">{stats.total}</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-bold mb-2">PENDING REVIEW</h3>
                    <p className="text-4xl font-orbitron text-yellow-400">{stats.pending}</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-bold mb-2">ACCEPTED</h3>
                    <p className="text-4xl font-orbitron text-green-400">{stats.accepted}</p>
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
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500 italic">Loading data...</td>
                                </tr>
                            ) : applicants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No applicants yet.</td>
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
