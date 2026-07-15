"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { showAlert, showConfirm } from "@/lib/alert-store";

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
            const { data: allocsData, error: allocsError } = await supabase.from('allocations').select('*');
            if (allocsError) throw allocsError;
            const allocs = allocsData || [];

            // Sort by status, then date
            allocs.sort((a, b) => {
                if (a.status === b.status) return new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0);
                return a.status === 'issued' ? -1 : 1;
            });
            setAllocations(allocs);

            // Fetch Hardware for issuing
            const { data: hwData, error: hwError } = await supabase.from('hardware').select('*');
            if (hwError) throw hwError;
            setInventory(hwData || []);

        } catch (error) {
            console.error("Error fetching data:", error);
            await showAlert("Error loading data: " + error.message, "Load Error");
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
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('memberId', memberSearch.trim())
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSelectedMember(data);
                setSearchResult(
                    <div className="text-sm">
                        <div className="text-green-400 font-bold">Member Found: {data.name}</div>
                        <div className="text-xs text-slate-400">{data.email} | {data.branch}</div>
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
            await showAlert("Complete all fields.", "Missing Fields");
            return;
        }

        try {
            const item = inventory.find(i => i.id === selectedItemId);
            if (!item || item.availableQuantity <= 0) {
                await showAlert("Item not available in stock.", "Stock Error");
                return;
            }

            // Create Allocation in Supabase
            const { error: allocError } = await supabase
                .from('allocations')
                .insert([{
                    userId: selectedMember.uid,
                    userName: selectedMember.name,
                    memberId: selectedMember.memberId,
                    itemId: selectedItemId,
                    itemName: item.name,
                    expectedReturn: returnDate,
                    status: 'issued',
                    issuedAt: new Date().toISOString()
                }]);
            if (allocError) throw allocError;

            // Decrease quantity
            const { error: hwUpdateError } = await supabase
                .from('hardware')
                .update({ availableQuantity: item.availableQuantity - 1 })
                .eq('id', selectedItemId);
            if (hwUpdateError) throw hwUpdateError;

            await showAlert("Item Issued Successfully!", "Issue Confirmed");
            setMemberSearch("");
            setSelectedMember(null);
            setSearchResult(null);
            setSelectedItemId("");
            setReturnDate("");
            fetchData();
        } catch (error) {
            await showAlert("Error issuing item: " + error.message, "Issue Error");
        }
    };

    const handleReturn = async (allocId, itemId) => {
        const isConfirmed = await showConfirm("Confirm return of this item?", "Return Hardware");
        if (!isConfirmed) return;
        try {
            // Update Allocation Status in Supabase
            const { error: allocReturnError } = await supabase
                .from('allocations')
                .update({
                    status: 'returned',
                    returnedAt: new Date().toISOString()
                })
                .eq('id', allocId);
            if (allocReturnError) throw allocReturnError;

            // Increase quantity
            const { data: itemDoc, error: getHwError } = await supabase
                .from('hardware')
                .select('availableQuantity')
                .eq('id', itemId)
                .single();
            if (getHwError) throw getHwError;

            if (itemDoc) {
                const currentQty = itemDoc.availableQuantity || 0;
                const { error: hwReturnError } = await supabase
                    .from('hardware')
                    .update({ availableQuantity: currentQty + 1 })
                    .eq('id', itemId);
                if (hwReturnError) throw hwReturnError;
            }

            await showAlert("Item Returned!", "Return Confirmed");
            fetchData();
        } catch (error) {
            await showAlert("Error returning item: " + error.message, "Return Error");
        }
    };

    return (
        <div className="font-inter">
            {/* Issue Form */}
            <div className="mb-10 bg-[#111115] border border-white/[0.04] p-6 rounded-xl shadow-lg">
                <h2 className="text-sm font-orbitron font-bold text-cyan-400 tracking-wider mb-4 uppercase">ISSUE HARDWARE</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Search Member by Member ID (e.g., RC-26-0001)"
                                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" />
                            <button onClick={handleSearchMember}
                                className="absolute right-2 top-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-orbitron font-bold rounded-lg transition-colors cursor-pointer">SEARCH</button>
                        </div>
                        {searchResult && (
                            <div className="mt-2 p-3 bg-black/40 border border-white/[0.05] rounded-lg">
                                {searchResult}
                            </div>
                        )}
                    </div>
                    <div>
                        <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}
                            className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-2 text-sm text-gray-300 transition-colors">
                            <option value="">Select Item...</option>
                            {inventory.filter(item => item.availableQuantity > 0).map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.availableQuantity} avail)</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end justify-between border-t border-white/[0.04] pt-4">
                    <div className="w-full sm:w-auto">
                        <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Expected Return Date</label>
                        <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                            className="bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-1.5 text-sm text-white transition-colors" />
                    </div>
                    <button onClick={handleIssue} disabled={!selectedMember || !selectedItemId || !returnDate}
                        className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:opacity-50 text-white text-xs font-orbitron font-bold rounded-lg transition-colors uppercase tracking-wider">
                        CONFIRM ALLOCATION
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 font-mono text-sm">
                        &gt; Syncing allocation ledgers...
                    </div>
                ) : allocations.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 italic text-sm">
                        No hardware allocations recorded.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 pl-6">Member ID</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Item Allocated</th>
                                    <th className="p-4">Expected Return</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {allocations.map((alloc) => (
                                    <tr key={alloc.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 pl-6 font-mono text-cyan-400 text-xs font-bold">{alloc.memberId}</td>
                                        <td className="p-4 text-white font-medium">{alloc.userName}</td>
                                        <td className="p-4 text-gray-300 font-mono text-xs">{alloc.itemName}</td>
                                        <td className="p-4 text-gray-400 font-mono text-xs">
                                            {alloc.expectedReturn ? new Date(alloc.expectedReturn).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                alloc.status === 'issued'
                                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            }`}>
                                                {alloc.status}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            {alloc.status === 'issued' ? (
                                                <button onClick={() => handleReturn(alloc.id, alloc.itemId)}
                                                    className="px-2.5 py-1.5 bg-green-950/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors">
                                                    MARK RETURNED
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-500 italic font-mono">
                                                    Returned {alloc.returnedAt ? new Date(alloc.returnedAt).toLocaleDateString() : ""}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
