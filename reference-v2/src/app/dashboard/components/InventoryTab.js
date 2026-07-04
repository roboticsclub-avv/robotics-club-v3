"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
            const { data, error } = await supabase.from('hardware').select('*');
            if (error) throw error;
            setInventory(data || []);
        } catch (error) {
            console.error("Error fetching hardware:", error);
            alert("Error loading hardware: " + error.message);
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
            const dataToSave = {
                ...formData,
                totalQuantity: parseInt(formData.totalQuantity, 10),
            };

            if (editingId) {
                // If editing, available quantity is reset to total quantity (naive approach from old code)
                dataToSave.availableQuantity = dataToSave.totalQuantity;
                const { error } = await supabase.from('hardware').update(dataToSave).eq('id', editingId);
                if (error) throw error;
                setEditingId(null);
            } else {
                dataToSave.availableQuantity = dataToSave.totalQuantity;
                const { error } = await supabase.from('hardware').insert([dataToSave]);
                if (error) throw error;
            }
            setFormData({ name: "", category: "", totalQuantity: "", image: "" });
            fetchInventory();
        } catch (error) {
            alert("Error saving item: " + error.message);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name || "",
            category: item.category || "",
            totalQuantity: item.totalQuantity || "",
            image: item.image || ""
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            const { error } = await supabase.from('hardware').delete().eq('id', id);
            if (error) throw error;
            fetchInventory();
        } catch (error) {
            alert("Error deleting item: " + error.message);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: "", category: "", totalQuantity: "", image: "" });
    };

    return (
        <div>
            {/* Form */}
            <div className="mb-10 glass-card p-6">
                <h2 className="text-xl font-bold font-orbitron text-white mb-4">
                    {editingId ? "EDIT HARDWARE ITEM" : "ADD HARDWARE ITEM"}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Item Name (e.g., Arduino Uno)" required
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400" />
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category (e.g., Microcontroller)" required
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400" />
                    <input type="number" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} placeholder="Total Quantity" required
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400" />
                    <input type="url" name="image" value={formData.image} onChange={handleChange} placeholder="Image URL (Optional)"
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400" />

                    <div className="md:col-span-2 flex gap-4">
                        <button type="submit" className="flex-grow bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold font-orbitron py-2 rounded hover:opacity-90 transition-opacity">
                            {editingId ? "UPDATE ITEM" : "SAVE ITEM"}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancel} className="px-6 bg-slate-700 text-white font-bold font-orbitron py-2 rounded hover:bg-slate-600 transition-colors">
                                CANCEL
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h2 className="text-lg font-bold font-orbitron text-white">INVENTORY LIST</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Item</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Quantity (Avail/Total)</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500 italic">Loading inventory...</td></tr>
                            ) : inventory.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No hardware found.</td></tr>
                            ) : (
                                inventory.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{item.name}</div>
                                            <div className="text-[10px] text-slate-500">{item.id}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300">{item.category}</td>
                                        <td className="p-4">
                                            <span className="text-cyan-400 font-bold">{item.availableQuantity}</span>
                                            <span className="text-slate-500"> / {item.totalQuantity}</span>
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white text-xs rounded border border-cyan-600/50 transition-all">EDIT</button>
                                            <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs rounded border border-red-600/50 transition-all">DELETE</button>
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
