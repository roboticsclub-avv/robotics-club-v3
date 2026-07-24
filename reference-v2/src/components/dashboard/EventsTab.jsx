"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { showAlert, showConfirm } from "@/lib/alert-store";
import { formatDate } from "@/utils/formatters";

export default function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    comingSoon: false,
    description: "",
    link: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const fileInputRef = useRef(null);

  const [editingId, setEditingId] = useState(null);

  const fetchEventsData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;

      const evts = data || [];
      // Sort by comingSoon first, then date
      evts.sort((a, b) => {
        if (a.comingSoon === b.comingSoon) {
          return new Date(a.date || 0) - new Date(b.date || 0);
        }
        return a.comingSoon ? -1 : 1;
      });
      setEvents(evts);
    } catch (error) {
      console.error("Error fetching events:", error);
      await showAlert("Error loading events: " + error.message, "Load Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split(".").pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('events')
      .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
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
        title: formData.title,
        comingSoon: formData.comingSoon,
        description: formData.description,
        image: finalImageUrl || "",
        date: formData.comingSoon ? "" : formData.date,
        link: formData.comingSoon ? "" : formData.link
      };

      if (editingId) {
        const { error } = await supabase
          .from('events')
          .update(dataToSave)
          .eq('id', editingId);
        if (error) throw error;
        await showAlert("Event updated successfully!", "Success");
      } else {
        const { error } = await supabase
          .from('events')
          .insert([dataToSave]);
        if (error) throw error;
        await showAlert("Event created successfully!", "Success");
      }

      handleCancel();
      fetchEventsData();
    } catch (error) {
      console.error("Error saving event:", error);
      await showAlert("Error saving event: " + error.message, "Save Error");
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

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm("Are you sure you want to delete this event?", "Delete Event");
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await showAlert("Event deleted successfully", "Deleted");
      fetchEventsData();
    } catch (error) {
      await showAlert("Error deleting event: " + error.message, "Delete Error");
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
    <div className="space-y-8 font-inter">
      {/* Event Form */}
      <div className="bg-[#111115] border border-white/[0.04] p-6 rounded-xl shadow-lg">
        <h2 className="text-sm font-orbitron font-bold text-cyan-400 tracking-wider mb-6 uppercase">
          {editingId ? "Edit Event details" : "Create New Event"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Event Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required
                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" placeholder="e.g. Robocon Workshop" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Event Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange}
                  disabled={formData.comingSoon} required={!formData.comingSoon}
                  className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-1.5 text-sm text-white transition-colors disabled:opacity-40" />
              </div>
              <div className="flex items-center pl-2 pt-5">
                <label className="flex items-center gap-2.5 text-xs text-gray-400 cursor-pointer font-orbitron font-semibold uppercase tracking-wider">
                  <input type="checkbox" name="comingSoon" checked={formData.comingSoon} onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer" />
                  COMING SOON
                </label>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Registration Link</label>
              <input type="url" name="link" value={formData.link} onChange={handleChange}
                disabled={formData.comingSoon} placeholder="https://..."
                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter disabled:opacity-40" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Event Banner Image</label>
              <div className="flex items-center gap-4 bg-black/30 border border-white/[0.04] rounded-lg p-4">
                {currentImageUrl && !imageFile && (
                  <img src={currentImageUrl} alt="Current event graphic" className="w-16 h-16 object-cover rounded shadow border border-white/[0.1]" />
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border file:border-cyan-500/30 file:text-xs file:font-orbitron file:font-bold file:bg-cyan-950/20 file:text-cyan-400 hover:file:bg-cyan-600 hover:file:text-white transition-all cursor-pointer"
                />
                {imageFile && <span className="text-xs text-green-400 font-mono">New file selected</span>}
              </div>
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-mono uppercase mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Event description details..." rows="3" required
                className="w-full bg-black/40 border border-white/[0.06] hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 transition-colors font-inter" />
            </div>
          </div>

          <div className="md:col-span-2 flex gap-4 border-t border-white/[0.04] pt-4">
            <button type="submit" disabled={isUploading} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50">
              {isUploading ? "SAVING & UPLOADING..." : (editingId ? "UPDATE EVENT RECORD" : "PUBLISH EVENT NOW")}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} disabled={isUploading} className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-orbitron font-bold text-xs rounded-lg transition-colors">
                CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Event List Container */}
      <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-white/[0.04] bg-black/30 flex justify-between items-center">
          <h2 className="font-orbitron text-sm font-bold text-gray-400 tracking-wider">
            REGISTERED SYSTEM EVENTS
          </h2>
          <span className="text-xs bg-cyan-950/20 text-cyan-400 border border-cyan-800/30 px-2.5 py-1 rounded font-mono">
            COUNT: {events.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-mono text-sm">
            &gt; Syncing event log registers...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic text-sm">
            No events found in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {events.map((event) => {
              const formattedDate = event.comingSoon
                ? "COMING SOON"
                : event.date
                ? formatDate(event.date)
                : "Date TBD";
              
              return (
                <div
                  key={event.id}
                  className="bg-black/40 border border-white/[0.04] rounded-lg overflow-hidden flex flex-col hover:border-cyan-500/20 transition-all shadow-md group hover:shadow-[0_0_20px_rgba(8,145,178,0.05)]"
                >
                  {/* Event Thumbnail */}
                  <div className="h-40 relative bg-slate-900 overflow-hidden shrink-0">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.parentNode.innerHTML = `
                            <div class="w-full h-full flex flex-col items-center justify-center text-cyan-500/40 p-4">
                              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <span class="text-[9px] font-mono mt-2">IMAGE UNREACHABLE</span>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-cyan-500/40 p-4">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-[9px] font-mono mt-2">NO EVENT IMAGE</span>
                      </div>
                    )}
                    
                    {/* Coming soon indicator */}
                    {event.comingSoon && (
                      <div className="absolute top-3 right-3 bg-purple-500 text-white font-orbitron font-bold text-[9px] px-2 py-0.5 rounded tracking-widest uppercase shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                        Coming Soon
                      </div>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-orbitron font-bold text-white text-sm tracking-wide leading-snug group-hover:text-cyan-400 transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 font-mono">
                        <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formattedDate}</span>
                      </div>

                      <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Actions block */}
                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                      {event.link ? (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-orbitron font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
                        >
                          REG LINK
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-[9px] text-gray-600 font-mono">NO LINK</span>
                      )}

                      <div className="space-x-2 shrink-0">
                        <button
                          onClick={() => handleEdit(event)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-orbitron font-bold rounded tracking-wider border border-slate-700 transition-colors"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="px-2 py-1 bg-red-950/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-[9px] font-orbitron font-bold rounded tracking-wider transition-colors"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
