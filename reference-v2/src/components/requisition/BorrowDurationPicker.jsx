"use client";

import React, { useEffect } from "react";

export default function BorrowDurationPicker({ formData, setFormData, errors }) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Auto calculate total borrow days whenever dates change
  useEffect(() => {
    if (formData.takeaway_date && formData.return_date) {
      const start = new Date(formData.takeaway_date);
      const end = new Date(formData.return_date);

      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start day
        setFormData((prev) => ({ ...prev, total_days: diffDays }));
      } else {
        setFormData((prev) => ({ ...prev, total_days: 0 }));
      }
    }
  }, [formData.takeaway_date, formData.return_date, setFormData]);

  return (
    <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4 font-inter">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="font-orbitron text-sm font-bold text-gray-200 tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          BORROW DURATION & SCHEDULE
        </h3>
        <span className="text-xs text-gray-500">Step 3 of 3</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
        {/* Takeaway Date */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium block">
            Takeaway / Issue Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={formData.takeaway_date || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, takeaway_date: e.target.value }))
            }
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          />
          {errors?.takeaway_date && (
            <p className="text-xs text-red-400">{errors.takeaway_date}</p>
          )}
        </div>

        {/* Expected Return Date */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium block">
            Expected Return Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            min={formData.takeaway_date || todayStr}
            value={formData.return_date || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, return_date: e.target.value }))
            }
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          />
          {errors?.return_date && (
            <p className="text-xs text-red-400">{errors.return_date}</p>
          )}
        </div>

        {/* Live Days Counter Display */}
        <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3 text-center space-y-1">
          <span className="text-[11px] text-gray-400 block font-mono">
            TOTAL BORROW DURATION
          </span>
          <span
            className={`text-xl font-bold font-orbitron ${
              formData.total_days > 0 ? "text-purple-400" : "text-gray-600"
            }`}
          >
            {formData.total_days > 0 ? `${formData.total_days} Days` : "-- Days"}
          </span>
        </div>
      </div>
    </div>
  );
}
