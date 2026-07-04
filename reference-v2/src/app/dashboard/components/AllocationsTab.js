"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AllocationsTab() {
    const [allocations, setAllocations] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [memberSearch, setMemberSearch] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedItemId, setSelectedItemId] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [searchResult, setSearchResult] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Allocations
            const { data: allocData, error: allocError } = await supabase.from('allocations').select('*');
            if (allocError) throw allocError;
            const allocs = allocData || [];

            // Sort by status, then date
            allocs.sort((a, b) => {
                if (a.status === b.status) return new Date(b.issuedAt) - new Date(a.issuedAt);
                return a.status === 'issued' ? -1 : 1;
            });
            setAllocations(allocs);

            // Fetch Hardware for issuing
            const { data: hwData, error: hwError } = await supabase.from('hardware').select('*');
            if (hwError) throw hwError;
            setInventory(hwData || []);

        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Error loading data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearchMember = async () => {
        if (!memberSearch.trim()) return;
        setSearchResult("Searching...");

        try {
            const { data, error } = await supabase.from('users').select('*').eq('memberId', memberSearch.trim());
            if (error) throw error;

            if (data && data.length > 0) {
                const memberData = { ...data[0], id: data[0].uid };
                setSelectedMember(memberData);
                setSearchResult(
                    <div className="text-sm">
                        <div className="text-green-400 font-bold">Member Found: {memberData.name}</div>
                        <div className="text-xs text-slate-400">{memberData.email} | {memberData.branch}</div>
                    </div>
                );
            } else {
                setSelectedMember(null);
                setSearchResult(<div className="text-sm text-red-400">No member found with ID: {memberSearch}</div>);
            }
        } catch (error) {
            console.error(error);
            setSearchResult(<div className="text-sm text-red-400">Error searching.</div>);
        }
    };

    const handleIssue = async () => {
        if (!selectedMember || !selectedItemId || !returnDate) {
            alert("Complete all fields.");
            return;
        }

        try {
            const item = inventory.find(i => i.id === selectedItemId || i.id === Number(selectedItemId)); // Supabase ID might be int
            if (!item || item.availableQuantity <= 0) {
                alert("Item not available.");
                return;
            }

            // Create Allocation
            const { error: insertError } = await supabase.from('allocations').insert([
                {
                    userId: selectedMember.uid,
                    userName: selectedMember.name,
                    memberId: selectedMember.memberId,
                    itemId: selectedItemId,
                    itemName: item.name,
                    expectedReturn: returnDate,
                    status: 'issued',
                    issuedAt: new Date().toISOString()
                }
            ]);
            if (insertError) throw insertError;

            // Decrease quantity
            const { error: updateError } = await supabase.from('hardware').update({
                availableQuantity: item.availableQuantity - 1
            }).eq('id', selectedItemId);
            if (updateError) throw updateError;

            alert("Item Issued Successfully!");
            setMemberSearch("");
            setSelectedMember(null);
            setSearchResult(null);
            setSelectedItemId("");
            setReturnDate("");
            fetchData();
        } catch (error) {
            alert("Error issuing item: " + error.message);
        }
    };

    const handleReturn = async (allocId, itemId) => {
        if (!confirm("Confirm return of this item?")) return;
        try {
            // Update Allocation Status
            const { error: updateAllocError } = await supabase.from('allocations').update({
                status: 'returned',
                returnedAt: new Date().toISOString()
            }).eq('id', allocId);
            if (updateAllocError) throw updateAllocError;

            // Increase quantity
            const { data: itemData, error: itemError } = await supabase.from('hardware').select('availableQuantity').eq('id', itemId).single();
            if (itemError) throw itemError;

            if (itemData) {
                const { error: updateHwError } = await supabase.from('hardware').update({
                    availableQuantity: itemData.availableQuantity + 1
                }).eq('id', itemId);
                if (updateHwError) throw updateHwError;
            }

            alert("Item Returned!");
            fetchData();
        } catch (error) {
            alert("Error returning item: " + error.message);
        }
    };

    return (
        <div>
            {/* Issue Form */}
            <div className="mb-10 glass-card p-6">
                <h2 className="text-xl font-bold font-orbitron text-white mb-4">ISSUE HARDWARE</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Search Member by Member ID (e.g., RC-1234)"
                                className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 transition-all" />
                            <button onClick={handleSearchMember}
                                className="absolute right-2 top-1.5 px-3 py-1 bg-cyan-600 text-white text-xs font-bold rounded">SEARCH</button>
                        </div>
                        {searchResult && (
                            <div className="mt-2 p-3 bg-slate-900/50 rounded border border-slate-700">
                                {searchResult}
                            </div>
                        )}
                    </div>
                    <div>
                        <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400">
                            <option value="">Select Item...</option>
                            {inventory.filter(item => item.availableQuantity > 0).map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.availableQuantity} avail)</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2 text-sm text-slate-400">
                        <label className="block mb-1">Expected Return Date:</label>
                        <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400" />
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleIssue} disabled={!selectedMember || !selectedItemId || !returnDate}
                            className="w-full bg-green-600 text-white font-bold font-orbitron py-2 rounded hover:bg-green-500 transition-colors disabled:opacity-50">
                            ISSUE ITEM
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h2 className="text-lg font-bold font-orbitron text-white">ACTIVE ALLOCATIONS</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Item</th>
                                <th className="p-4">Issued Date</th>
                                <th className="p-4">Return Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">Loading records...</td></tr>
                            ) : allocations.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No records.</td></tr>
                            ) : (
                                allocations.map((record) => {
                                    const isIssued = record.status === 'issued';
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-white">{record.userName}</div>
                                                <div className="text-[10px] text-cyan-600 font-mono">{record.memberId}</div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-300">{record.itemName}</td>
                                            <td className="p-4 text-xs text-slate-400">
                                                {record.issuedAt ? new Date(record.issuedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className={`p-4 text-xs ${isIssued ? 'text-yellow-500' : 'text-slate-500'}`}>
                                                {record.expectedReturn}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isIssued ? 'text-yellow-400 bg-yellow-400/10' : 'text-green-400 bg-green-400/10'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {isIssued && (
                                                    <button onClick={() => handleReturn(record.id, record.itemId)}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded font-bold transition-colors">
                                                        MARK RETURNED
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
