"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_GALLERY_ITEMS = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1531746790733-2488c0672045?q=80&w=800&auto=format&fit=crop",
    title: "KICK-OFF WORKSHOP",
    date: "2025-10-15",
    category: "Workshop",
    aspect: "tall"
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1606663889134-b1dedb548b08?q=80&w=800&auto=format&fit=crop",
    title: "ROBOCUP PRACTICE",
    date: "2025-09-20",
    category: "Competition",
    aspect: "wide"
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1581092580497-c2d29cb5f324?q=80&w=800&auto=format&fit=crop",
    title: "DRONE TESTING",
    date: "2025-09-10",
    category: "R&D",
    aspect: "square"
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop",
    title: "AI SEMINAR",
    date: "2025-08-05",
    category: "Seminar",
    aspect: "tall"
  }
];

export default function MediaTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Workshop");
  const [date, setDate] = useState("");
  const [aspect, setAspect] = useState("square");
  const [hyperlink, setHyperlink] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from('gallery').select('*');
      if (error) throw error;
      
      const fetched = data || [];
      if (fetched.length === 0) {
        setItems(DEFAULT_GALLERY_ITEMS);
      } else {
        setItems(fetched);
      }
    } catch (err) {
      console.error("Error loading gallery:", err);
      setItems(DEFAULT_GALLERY_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleResetForm = () => {
    setTitle("");
    setCategory("Workshop");
    setDate("");
    setAspect("square");
    setHyperlink("");
    setFile(null);
    setEditingItem(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setDate(item.date);
    setAspect(item.aspect || "square");
    setHyperlink(item.hyperlink || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date) {
      alert("Please fill in the title and date.");
      return;
    }

    setUploading(true);

    try {
      let finalUrl = editingItem ? editingItem.url : "";

      // Upload file to Supabase Storage if selected
      if (file) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(fileName);
        finalUrl = publicUrlData.publicUrl;
      }

      if (!finalUrl && !editingItem) {
        alert("Please upload an image file.");
        setUploading(false);
        return;
      }

      const itemPayload = {
        title: title.toUpperCase(),
        category,
        date,
        aspect,
        url: finalUrl,
        hyperlink: hyperlink.trim() || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('gallery')
          .update(itemPayload)
          .eq('id', editingItem.id);
        if (error) throw error;
        console.log("Gallery item updated.");
      } else {
        const { error } = await supabase
          .from('gallery')
          .insert([itemPayload]);
        if (error) throw error;
        console.log("Gallery item created.");
      }

      handleResetForm();
      await fetchItems();
    } catch (err) {
      console.error("Error saving gallery item:", err);
      alert("Failed to save gallery item: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log("Gallery item deleted.");
      await fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold font-orbitron text-white tracking-wider">
            GALLERY & MEDIA MANAGER
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-inter">
            Publish custom high-resolution club snapshots and manage the image gallery.
          </p>
        </div>
      </div>

      {/* Management UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of current items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold font-orbitron text-gray-400 tracking-wider">
              IMAGE INVENTORY
            </h2>

            {loading ? (
              <div className="text-center py-12 text-cyan-400 font-orbitron animate-pulse">LOADING IMAGES...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-black/20 border border-white/5 rounded-2xl text-gray-500 font-mono">
                No images published yet. Create one on the right.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-4 rounded-xl border border-white/[0.05] hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-lg overflow-hidden shrink-0 relative">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                          {item.category}
                        </span>
                        <h3 className="font-orbitron font-bold text-white text-sm mt-2 truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{item.date}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.03]">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 font-orbitron text-[10px] rounded transition-all"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 bg-red-950/20 hover:bg-red-900/30 text-red-400 font-orbitron text-[10px] rounded transition-all border border-red-500/10"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form container */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold font-orbitron text-gray-400 tracking-wider">
              {editingItem ? "EDIT IMAGE DETAILS" : "PUBLISH NEW IMAGE"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="bg-[#0c0c0e] border border-white/[0.05] p-6 rounded-2xl space-y-4"
            >
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Image Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LAB TESTING"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-orbitron"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                    <option value="R&D">R&D</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Lab">Lab</option>
                    <option value="Training">Training</option>
                    <option value="Exhibition">Exhibition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="square">Square (1:1)</option>
                    <option value="wide">Wide (16:9)</option>
                    <option value="tall">Tall (4:5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Publish Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Google Photos Shared Folder Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://photos.app.goo.gl/..."
                  value={hyperlink}
                  onChange={(e) => setHyperlink(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Image File
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-gray-400 bg-black/40 border border-white/10 rounded-xl p-3 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 file:cursor-pointer hover:file:bg-cyan-500/20"
                />
                {editingItem && (
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">
                    * Leave empty to keep existing image.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
                >
                  {uploading ? "UPLOADING..." : editingItem ? "SAVE CHANGES" : "PUBLISH IMAGE"}
                </button>

                {editingItem && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-3 bg-white/[0.04] border border-white/10 text-gray-400 font-orbitron font-semibold text-xs rounded-xl hover:bg-white/[0.08] transition-colors"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
