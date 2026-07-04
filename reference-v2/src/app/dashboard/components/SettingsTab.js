"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsTab() {
    const [isRecruiting, setIsRecruiting] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('id', 'is_recruiting')
                    .single();
                
                if (error) throw error;
                if (data) setIsRecruiting(data.value);
            } catch (err) {
                console.error("Error fetching settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const toggleRecruiting = async () => {
        setSaving(true);
        const newValue = !isRecruiting;
        try {
            const { error } = await supabase
                .from('settings')
                .update({ value: newValue })
                .eq('id', 'is_recruiting');
            
            if (error) throw error;
            setIsRecruiting(newValue);
        } catch (err) {
            console.error("Failed to update setting:", err);
            alert("Failed to update setting: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 italic">Accessing Configuration...</div>;

    return (
        <div className="mb-10 glass-card p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold font-orbitron text-white mb-6 border-b border-slate-700 pb-2">
                SITE CONFIGURATION
            </h2>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Recruitment Status</h3>
                    <p className="text-sm text-slate-400">Toggle whether the robotics club is currently accepting applications.</p>
                </div>
                <button 
                    onClick={toggleRecruiting}
                    disabled={saving}
                    className="flex flex-shrink-0 items-center w-14 h-7 rounded-full p-1 cursor-pointer transition-colors border border-slate-500 focus:outline-none ml-4"
                    style={{ backgroundColor: isRecruiting ? '#047857' : '#1e293b' }}
                >
                    <div 
                        className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300"
                        style={{ transform: isRecruiting ? 'translateX(26px)' : 'translateX(0)' }}
                    />
                </button>
            </div>
            {isRecruiting ? (
                <div className="mt-4 text-sm font-mono text-cyan-400 text-center">STATUS: ACTIVE (Orange message on homepage)</div>
            ) : (
                <div className="mt-4 text-sm font-mono text-green-400 text-center">STATUS: CLOSED (Green 'Welcome Club Members' on homepage)</div>
            )}
        </div>
    );
}
