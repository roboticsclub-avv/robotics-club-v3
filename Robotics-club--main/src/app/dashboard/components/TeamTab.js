"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const getImageUrl = (url) => {
    if (!url) return null;
    // Absolute URLs (Supabase storage etc.) — use as-is
    if (url.startsWith('http')) return url;
    // Local paths (e.g. /media/Shashwat.jpg) — prepend basePath
    return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${url}`;
};

export default function TeamTab() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: "", role: "", quote: "", bio: "", research: "", type: "member", display_order: 0
    });

    // We separately track the image upload state
    const [imageFile, setImageFile] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState("");

    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('core_team')
                .select('*')
                .order('display_order', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            setTeam(data || []);
        } catch (error) {
            console.error("Error fetching team:", error);
            alert("Error loading team: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? parseInt(e.target.value, 10) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`; // Upload to root of team-images bucket

        const { error: uploadError } = await supabase.storage
            .from('team-images')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('team-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let finalImageUrl = currentImageUrl;

            // If a new file is selected, upload it FIRST to get the URL
            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            const dataToSave = {
                ...formData,
                image_url: finalImageUrl,
            };

            if (editingId) {
                const { error } = await supabase.from('core_team').update(dataToSave).eq('id', editingId);
                if (error) throw error;
                setEditingId(null);
            } else {
                const { error } = await supabase.from('core_team').insert([dataToSave]);
                if (error) throw error;
            }

            handleCancel();
            fetchTeam();

        } catch (error) {
            console.error("Error saving member:", error);
            alert("Error saving member: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (member) => {
        setEditingId(member.id);
        setFormData({
            name: member.name || "",
            role: member.role || "",
            quote: member.quote || "",
            bio: member.bio || "",
            research: member.research || "",
            type: member.type || "member",
            display_order: member.display_order || 0
        });
        setCurrentImageUrl(member.image_url || "");
        setImageFile(null); // Clear file input
        if (fileInputRef.current) fileInputRef.current.value = "";

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to completely delete this team member? This cannot be undone.")) return;
        try {
            const { error } = await supabase.from('core_team').delete().eq('id', id);
            if (error) throw error;
            fetchTeam();
        } catch (error) {
            alert("Error deleting member: " + error.message);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: "", role: "", quote: "", bio: "", research: "", type: "member", display_order: 0 });
        setCurrentImageUrl("");
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div>
            {/* Team Management Form */}
            <div className="mb-10 glass-card p-6">
                <h2 className="text-xl font-bold font-orbitron text-white mb-4">
                    {editingId ? "EDIT TEAM MEMBER" : "ADD CORE TEAM MEMBER"}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name (e.g. SHASHWAT MISHRA)" required
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold" />

                    <div className="flex gap-2">
                        <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="Role (e.g. PRESIDENT)" required
                            className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 uppercase" />
                        <select name="type" value={formData.type} onChange={handleChange}
                            className="bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white focus:outline-none focus:border-cyan-400">
                            <option value="member">Student Member</option>
                            <option value="faculty">Faculty Advisor</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Upload Profile Photo</label>
                        <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-600 rounded p-4">
                            {currentImageUrl && !imageFile && (
                                <img src={getImageUrl(currentImageUrl)} alt="Current" className="w-16 h-16 object-cover rounded shadow border border-slate-700" />
                            )}
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-cyan-600/20 file:text-cyan-400 hover:file:bg-cyan-600/30 transition-all cursor-pointer"
                            />
                            {imageFile && <span className="text-xs text-green-400">New file selected for upload</span>}
                        </div>
                    </div>

                    <input type="text" name="quote" value={formData.quote} onChange={handleChange} placeholder="Hover Quote (e.g. 'Execution is everything.')"
                        className="md:col-span-2 bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 italic" />

                    <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Biography / Experience text for profile modal" rows="3" required
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400"></textarea>

                    <textarea name="research" value={formData.research} onChange={handleChange} placeholder="Research Interests (Comma separated) or Focus areas" rows="3" required
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400"></textarea>

                    <div className="md:col-span-2 flex items-center justify-between border-t border-slate-700 mt-4 pt-4">
                        <div className="flex items-center gap-4">
                            <label className="text-xs text-slate-400 font-mono">SORT ORDER (Lowest first):</label>
                            <input type="number" name="display_order" value={formData.display_order} onChange={handleChange}
                                className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-cyan-400 text-center" />
                        </div>

                        <div className="flex gap-4">
                            {editingId && (
                                <button type="button" onClick={handleCancel} disabled={isUploading} className="px-6 bg-slate-700 text-white font-bold font-orbitron py-2 rounded hover:bg-slate-600 transition-colors">
                                    CANCEL
                                </button>
                            )}
                            <button type="submit" disabled={isUploading} className="px-8 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold font-orbitron py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                                {isUploading ? "UPLOADING..." : (editingId ? "SAVE CHANGES" : "ADD MEMBER")}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Existing Core Team List */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h2 className="text-lg font-bold font-orbitron text-white">CURRENT CORE TEAM DIRECTORY</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Sort</th>
                                <th className="p-4">Member</th>
                                <th className="p-4">Quote & Interests</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500 italic">Accessing Records...</td></tr>
                            ) : team.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No core team members added yet.</td></tr>
                            ) : (
                                team.map(member => (
                                    <tr key={member.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono text-cyan-500 bg-cyan-950 px-2 py-1 rounded text-xs">{member.display_order}</span>
                                        </td>
                                        <td className="p-4 flex gap-4 items-center">
                                            {member.image_url ? (
                                                <img src={getImageUrl(member.image_url)} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-slate-600 shadow" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600" />
                                            )}
                                            <div>
                                                <div className="font-bold text-white uppercase">{member.name}</div>
                                                <div className={`text-xs ${member.type === 'faculty' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>{member.role}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-300 italic mb-1">&quot;{member.quote}&quot;</div>
                                            <div className="text-[10px] text-slate-500 max-w-xs truncate">{member.research}</div>
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <button onClick={() => handleEdit(member)} disabled={isUploading} className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white text-xs rounded border border-cyan-600/50 transition-all">EDIT</button>
                                            <button onClick={() => handleDelete(member.id)} disabled={isUploading} className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs rounded border border-red-600/50 transition-all">DELETE</button>
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
