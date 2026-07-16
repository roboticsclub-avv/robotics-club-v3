"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { showAlert, showConfirm } from "@/lib/alert-store";

const DEFAULT_PROJECT_EMOJIS = ["🤖", "🚀", "🦾", "🚁", "🚗", "⚙️", "🔋", "📡"];

const TAG_STYLES = ["tagPurple", "tagTeal", "tagOrange"];

export default function ProjectsTab() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        emoji: "🤖",
        description: "",
        tagsString: "",
        link: "#"
    });
    const [editingId, setEditingId] = useState(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('projects').select('*').order('createdAt', { ascending: false });
            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
            await showAlert("Error loading projects: " + error.message, "Load Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Parse tags from comma separated list
            const parsedTags = formData.tagsString
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0)
                .map((t, idx) => ({
                    label: t,
                    style: TAG_STYLES[idx % TAG_STYLES.length]
                }));

            const dataToSave = {
                title: formData.title,
                emoji: formData.emoji,
                description: formData.description,
                tags: parsedTags,
                link: formData.link || "#"
            };

            if (editingId) {
                const { error } = await supabase
                    .from('projects')
                    .update(dataToSave)
                    .eq('id', editingId);
                if (error) throw error;
                setEditingId(null);
            } else {
                const { error } = await supabase
                    .from('projects')
                    .insert([dataToSave]);
                if (error) throw error;
            }

            setFormData({ title: "", emoji: "🤖", description: "", tagsString: "", link: "#" });
            fetchProjects();
            await showAlert("Project saved successfully!", "Success");
        } catch (error) {
            await showAlert("Error saving project: " + error.message, "Save Error");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            emoji: item.emoji || "🤖",
            description: item.description,
            tagsString: (item.tags || []).map(t => t.label).join(", "),
            link: item.link || "#"
        });
    };

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirm("Are you sure you want to delete this project?", "Delete Project");
        if (!isConfirmed) return;
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchProjects();
            await showAlert("Project deleted successfully", "Deleted");
        } catch (error) {
            await showAlert("Error deleting project: " + error.message, "Delete Error");
        }
    };

    return (
        <div className="font-inter">
            {/* Form */}
            <div className="mb-10 bg-[#111115] border border-white/[0.04] p-6 rounded-xl shadow-lg">
                <h2 className="text-sm font-orbitron font-bold text-cyan-400 tracking-wider mb-4 uppercase">
                    {editingId ? "Edit Project" : "Add Project"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Project Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required
                                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" placeholder="e.g. Sumo Wrestling Bot" />
                        </div>
                        <div>
                            <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Emoji Icon</label>
                            <select name="emoji" value={formData.emoji} onChange={handleChange} required
                                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white transition-colors">
                                {DEFAULT_PROJECT_EMOJIS.map(em => (
                                    <option key={em} value={em}>{em}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Project Link</label>
                            <input type="text" name="link" value={formData.link} onChange={handleChange}
                                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" placeholder="e.g. # or github url" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows={3}
                            className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter resize-none" placeholder="Enter a brief project showcase description..." />
                    </div>

                    <div>
                        <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Tags (Comma-separated)</label>
                        <input type="text" name="tagsString" value={formData.tagsString} onChange={handleChange} required
                            className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" placeholder="e.g. Arduino, Robotics, Sensors" />
                    </div>

                    <div className="flex gap-2 justify-end">
                        {editingId && (
                            <button type="button" onClick={() => {
                                setEditingId(null);
                                setFormData({ title: "", emoji: "🤖", description: "", tagsString: "", link: "#" });
                            }} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-orbitron font-bold rounded-lg transition-colors">
                                CANCEL
                            </button>
                        )}
                        <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-orbitron font-bold rounded-lg transition-colors uppercase tracking-wider">
                            {editingId ? "UPDATE PROJECT" : "ADD PROJECT"}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 font-mono text-sm">
                        &gt; Reading project registers...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 italic text-sm">
                        No projects recorded. Add your first project above!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 pl-6">Emoji</th>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Tags</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {projects.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 pl-6 text-lg">{item.emoji || "🤖"}</td>
                                        <td className="p-4 text-white font-medium">{item.title}</td>
                                        <td className="p-4 text-gray-400 max-w-xs truncate">{item.description}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(item.tags || []).map((t, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 font-mono">
                                                        {t.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right flex justify-end gap-2 items-center">
                                            <button onClick={() => handleEdit(item)}
                                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-[10px] font-orbitron font-bold rounded tracking-wider transition-colors">
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
