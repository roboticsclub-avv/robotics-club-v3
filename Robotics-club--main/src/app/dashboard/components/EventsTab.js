"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function EventsTab() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "", date: "", comingSoon: false, description: "", link: ""
    });

    const [imageFile, setImageFile] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState("");
    const fileInputRef = useRef(null);

    const [editingId, setEditingId] = useState(null);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('events').select('*');
            if (error) throw error;
            const evts = data || [];

            // Sort by comingSoon first, then date
            evts.sort((a, b) => {
                if (a.comingSoon === b.comingSoon) {
                    return new Date(a.date) - new Date(b.date);
                }
                return a.comingSoon ? -1 : 1;
            });
            setEvents(evts);
        } catch (error) {
            console.error("Error fetching events:", error);
            alert("Error loading events: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
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
        const filePath = `${fileName}`;

        // Using the existing 'team-images' bucket that we know works
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

            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            const dataToSave = {
                ...formData,
                image: finalImageUrl
            };

            if (editingId) {
                const { error } = await supabase.from('events').update(dataToSave).eq('id', editingId);
                if (error) throw error;
                setEditingId(null);
            } else {
                const { error } = await supabase.from('events').insert([dataToSave]);
                if (error) throw error;
            }

            handleCancel();
            fetchEvents();
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Error saving event: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (event) => {
        setEditingId(event.id);
        setFormData({
            title: event.title || "",
            date: event.date || "",
            comingSoon: event.comingSoon || false,
            description: event.description || "",
            link: event.link || ""
        });
        setCurrentImageUrl(event.image || "");
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            fetchEvents();
        } catch (error) {
            alert("Error deleting event: " + error.message);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ title: "", date: "", comingSoon: false, description: "", link: "" });
        setCurrentImageUrl("");
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div>
            {/* Event Management Form */}
            <div className="mb-10 glass-card p-6">
                <h2 className="text-xl font-bold font-orbitron text-white mb-4">
                    {editingId ? "EDIT EVENT" : "CREATE NEW EVENT"}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Event Title" required
                        className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400" />

                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-600 rounded px-4 py-2">
                        <input type="date" name="date" value={formData.date} onChange={handleChange}
                            disabled={formData.comingSoon} required={!formData.comingSoon}
                            className={`bg-transparent text-white focus:outline-none flex-grow ${formData.comingSoon ? "opacity-50" : ""}`} />
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                            <input type="checkbox" name="comingSoon" checked={formData.comingSoon} onChange={handleChange}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus:ring-cyan-500" />
                            COMING SOON
                        </label>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Upload Event Banner Image</label>
                        <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-600 rounded p-4">
                            {currentImageUrl && !imageFile && (
                                <img src={currentImageUrl} alt="Current event graphic" className="w-16 h-16 object-cover rounded shadow border border-slate-700" />
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

                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Event Description" rows="2" required
                        className="md:col-span-2 bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400"></textarea>
                    <input type="url" name="link" value={formData.link} onChange={handleChange} placeholder="Registration Link"
                        disabled={formData.comingSoon}
                        className={`md:col-span-2 bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-400 ${formData.comingSoon ? "opacity-50" : ""}`} />

                    <div className="md:col-span-2 flex gap-4">
                        <button type="submit" disabled={isUploading} className="flex-grow bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold font-orbitron py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                            {isUploading ? "UPLOADING..." : (editingId ? "UPDATE EVENT" : "PUBLISH EVENT")}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancel} disabled={isUploading} className="px-6 bg-slate-700 text-white font-bold font-orbitron py-2 rounded hover:bg-slate-600 transition-colors">
                                CANCEL
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Event List */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h2 className="text-lg font-bold font-orbitron text-white">EXISTING EVENTS</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Event</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="3" className="p-8 text-center text-slate-500 italic">Loading events...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan="3" className="p-8 text-center text-slate-500">No events found.</td></tr>
                            ) : (
                                events.map(event => (
                                    <tr key={event.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 flex gap-4 items-center">
                                            {event.image ? (
                                                <img src={event.image} alt={event.title} className="w-12 h-12 object-cover rounded shadow border border-slate-600" />
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 text-[10px]">NO IMG</div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white">{event.title}</div>
                                                <div className="text-[10px] text-slate-500 max-w-xs truncate">{event.description}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {event.comingSoon ? (
                                                <span className="text-purple-400 text-xs font-bold">COMING SOON</span>
                                            ) : (
                                                <span className="text-slate-300 text-sm">{event.date}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <button onClick={() => handleEdit(event)} disabled={isUploading} className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white text-xs rounded border border-cyan-600/50 transition-all">EDIT</button>
                                            <button onClick={() => handleDelete(event.id)} disabled={isUploading} className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs rounded border border-red-600/50 transition-all">DELETE</button>
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
