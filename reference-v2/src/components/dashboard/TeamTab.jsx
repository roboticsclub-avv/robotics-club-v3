"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const getImageUrl = (url) => {
  if (!url) return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/media/placeholder.jpg`;
  if (url.startsWith('/')) return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${url}`;
  return url;
};

export default function TeamTab() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    quote: "",
    bio: "",
    research: "",
    type: "member",
    display_order: 0
  });

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
      alert("Error loading team directory: " + error.message);
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
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('team-images')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('team-images')
      .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageUrl = currentImageUrl;

      // Upload file to Supabase Storage if a new one is selected
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const dataToSave = {
        name: formData.name.trim(),
        role: formData.role.trim().toUpperCase(),
        quote: formData.quote.trim(),
        bio: formData.bio.trim(),
        research: formData.research.trim(),
        type: formData.type,
        display_order: Number(formData.display_order),
        image_url: finalImageUrl
      };

      if (editingId) {
        // Update document
        const { error } = await supabase
          .from('core_team')
          .update(dataToSave)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // Create document
        const { error } = await supabase
          .from('core_team')
          .insert([dataToSave]);
        if (error) throw error;
      }

      handleCancel();
      await fetchTeam();
      alert("Core team member successfully saved.");
    } catch (error) {
      console.error("Error saving core team member:", error);
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
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this team member? This cannot be undone.")) return;
    try {
      const { error } = await supabase
        .from('core_team')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchTeam();
      alert("Core team member removed.");
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Error deleting member: " + error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      role: "",
      quote: "",
      bio: "",
      research: "",
      type: "member",
      display_order: 0
    });
    setCurrentImageUrl("");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8 font-inter">
      {/* Header Info */}
      <div className="pb-4 border-b border-white/[0.05]">
        <h1 className="text-xl font-bold font-orbitron text-white tracking-wider">
          CORE TEAM DIRECTORY MANAGER
        </h1>
        <p className="text-xs text-gray-400 mt-1 font-inter">
          Manage faculty advisors and student leads featured on the homepage core team roster.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Editor Form */}
        <div className="bg-[#111115] border border-white/[0.04] p-6 rounded-xl space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold font-orbitron text-cyan-400 uppercase tracking-widest pb-2 border-b border-white/[0.05]">
            {editingId ? "Edit Team Member" : "Add Core Team Member"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. SHASHWAT MISHRA"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  required
                  placeholder="e.g. PRESIDENT"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 uppercase transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Member Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="member">Student Member</option>
                  <option value="faculty">Faculty Advisor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                Profile Photo
              </label>
              <div className="bg-black/20 border border-white/10 rounded-lg p-4 space-y-3">
                {currentImageUrl && !imageFile && (
                  <div className="flex items-center gap-3">
                    <img
                      src={getImageUrl(currentImageUrl)}
                      alt="Current preview"
                      className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-lg"
                    />
                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">
                      Active Image
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="w-full text-xs text-gray-400 bg-black/40 border border-white/10 rounded-lg p-2.5 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 file:cursor-pointer hover:file:bg-cyan-500/20 transition-all"
                />
                {imageFile && (
                  <p className="text-[10px] text-green-400 font-mono">
                    ✓ New image queued for upload
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                Hover Quote
              </label>
              <input
                type="text"
                name="quote"
                placeholder="e.g. 'Execution is everything.'"
                value={formData.quote}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 italic transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                Biography / Experience
              </label>
              <textarea
                name="bio"
                required
                placeholder="Describe details, roles and achievements..."
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-y"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                Research / Focus Interests
              </label>
              <textarea
                name="research"
                required
                placeholder="Comma separated: e.g. ROS, Machine Learning, UAVs"
                value={formData.research}
                onChange={handleChange}
                rows="2"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-y"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Sort Order:
                </span>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleChange}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500 text-center font-mono"
                />
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isUploading}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-orbitron text-[10px] font-bold rounded tracking-wider border border-slate-700 transition-colors"
                  >
                    CANCEL
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron text-[10px] font-bold rounded tracking-wider transition-colors disabled:opacity-50"
                >
                  {isUploading ? "UPLOADING..." : editingId ? "SAVE" : "ADD"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Core Roster Table List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111115] border border-white/[0.04] rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/[0.04] bg-black/30 flex justify-between items-center">
              <h2 className="text-xs font-bold font-orbitron text-gray-400 tracking-wider">
                CURRENT CORE TEAM DIRECTORY (COUNT: {team.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black/30 border-b border-white/[0.04] text-slate-400 font-orbitron uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4 pl-6 w-16">Sort</th>
                    <th className="p-4">Member</th>
                    <th className="p-4">Quote & Interests</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-gray-500 font-mono text-xs">
                        &gt; Accessing core team database archives...
                      </td>
                    </tr>
                  ) : team.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-gray-500 italic text-sm">
                        No core team members added yet. Add one using the panel on the left.
                      </td>
                    </tr>
                  ) : (
                    team.map((member) => (
                      <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 pl-6">
                          <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded text-xs border border-cyan-500/10">
                            {member.display_order}
                          </span>
                        </td>
                        <td className="p-4 flex gap-4 items-center">
                          <img
                            src={getImageUrl(member.image_url)}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-lg shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/media/placeholder.jpg";
                            }}
                          />
                          <div>
                            <div className="font-bold text-white uppercase text-xs">
                              {member.name}
                            </div>
                            <div className={`text-[10px] font-mono mt-0.5 ${member.type === 'faculty' ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                              {member.role} {member.type === 'faculty' && " (Faculty)"}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 max-w-xs">
                          {member.quote && (
                            <div className="text-xs text-gray-400 italic truncate">
                              &ldquo;{member.quote}&rdquo;
                            </div>
                          )}
                          <div className="text-[10px] text-gray-500 font-mono truncate mt-0.5">
                            {member.research}
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(member)}
                            className="px-2 py-1 bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 font-orbitron text-[10px] rounded transition-all"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="px-2 py-1 bg-red-950/20 hover:bg-red-900/30 text-red-400 font-orbitron text-[10px] rounded transition-all border border-red-500/10"
                          >
                            DELETE
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
