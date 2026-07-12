"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/firestore";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { showAlert, showConfirm } from "@/lib/alert-store";

export default function InventoryTab() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "", category: "", totalQuantity: "", image: ""
    });
    const [editingId, setEditingId] = useState(null);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "hardware"));
            const data = [];
            querySnapshot.forEach((docSnap) => {
                data.push({ id: docSnap.id, ...docSnap.data() });
            });
            setInventory(data || []);
        } catch (error) {
            console.error("Error fetching hardware:", error);
            await showAlert("Error loading hardware: " + error.message, "Load Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const totalQty = parseInt(formData.totalQuantity, 10);
            if (isNaN(totalQty) || totalQty < 0) {
                await showAlert("Please enter a valid quantity", "Validation Error");
                return;
            }

            const dataToSave = {
                name: formData.name,
                category: formData.category,
                totalQuantity: totalQty,
                image: formData.image || ""
            };

            if (editingId) {
                // For editing, set availableQuantity to totalQuantity (simple V2 logic)
                dataToSave.availableQuantity = totalQty;
                await updateDoc(doc(db, "hardware", editingId), dataToSave);
                setEditingId(null);
            } else {
                dataToSave.availableQuantity = totalQty;
                await addDoc(collection(db, "hardware"), dataToSave);
            }
            setFormData({ name: "", category: "", totalQuantity: "", image: "" });
            fetchInventory();
            await showAlert("Inventory updated successfully!", "Success");
        } catch (error) {
            await showAlert("Error saving item: " + error.message, "Save Error");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            category: item.category,
            totalQuantity: String(item.totalQuantity),
            image: item.image || ""
        });
    };

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirm("Are you sure you want to delete this hardware item?", "Delete Hardware");
        if (!isConfirmed) return;
        try {
            await deleteDoc(doc(db, "hardware", id));
            fetchInventory();
            await showAlert("Item deleted successfully", "Deleted");
        } catch (error) {
            await showAlert("Error deleting item: " + error.message, "Delete Error");
        }
    };

    return (
        <div className="font-inter">
            {/* Form */}
            <div className="mb-10 bg-[#111115] border border-white/[0.04] p-6 rounded-xl shadow-lg">
                <h2 className="text-sm font-orbitron font-bold text-cyan-400 tracking-wider mb-4 uppercase">
                    {editingId ? "Edit Hardware Item" : "Add Hardware Item"}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Item Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required
                            className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" placeholder="e.g. Arduino Uno" />
                    </div>
                    <div>
                        <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Category</label>
                        <input type="text" name="category" value={formData.category} onChange={handleChange} required
                            className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" placeholder="e.g. Microcontroller" />
                    </div>
                    <div>
                        <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Total Quantity</label>
                        <input type="number" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} required min="1"
                            className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" placeholder="e.g. 10" />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-orbitron font-bold rounded-lg transition-colors uppercase tracking-wider">
                            {editingId ? "UPDATE" : "ADD TO LIST"}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => {
                                setEditingId(null);
                                setFormData({ name: "", category: "", totalQuantity: "", image: "" });
                            }} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-orbitron font-bold rounded-lg transition-colors">
                                CANCEL
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 font-mono text-sm">
                        &gt; Syncing warehouse inventory...
                    </div>
                ) : inventory.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 italic text-sm">
                        No hardware registered in inventory database.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 pl-6">Item Details</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Available / Total</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02] text-sm">
                                {inventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 pl-6 font-bold text-white">
                                            {item.name}
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            {item.category}
                                        </td>
                                        <td className="p-4 font-mono">
                                            <span className={`${item.availableQuantity > 0 ? "text-green-400 font-bold" : "text-red-400"}`}>
                                                {item.availableQuantity}
                                            </span>
                                            <span className="text-gray-500"> / {item.totalQuantity}</span>
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-2">
                                            <button onClick={() => handleEdit(item)}
                                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-orbitron font-bold rounded tracking-wider border border-slate-700 transition-colors">
                                                EDIT
                                            </button>
                                            <button onClick={() => handleDelete(item.id)}
                                                className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors">
                                                DELETE
                                            </button>
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
