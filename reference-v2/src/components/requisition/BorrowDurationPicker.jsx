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
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 font-inter">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
        <h3 className="font-orbitron text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-wider flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-teal)]" />
          BORROW DURATION & SCHEDULE
        </h3>
        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">Step 3 of 3</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
        {/* Takeaway Date */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold block font-inter">
            Takeaway / Issue Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={formData.takeaway_date || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, takeaway_date: e.target.value }))
            }
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] transition duration-200"
          />
          {errors?.takeaway_date && (
            <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.takeaway_date}</p>
          )}
        </div>

        {/* Expected Return Date */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold block font-inter">
            Expected Return Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            min={formData.takeaway_date || todayStr}
            value={formData.return_date || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, return_date: e.target.value }))
            }
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] transition duration-200"
          />
          {errors?.return_date && (
            <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.return_date}</p>
          )}
        </div>

        {/* Live Days Counter Display */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl p-3.5 text-center space-y-1">
          <span className="text-xs text-[var(--text-secondary)] block font-mono">
            TOTAL BORROW DURATION
          </span>
          <span
            className={`text-2xl font-bold font-orbitron ${
              formData.total_days > 0 ? "text-[var(--accent-purple)]" : "text-[var(--text-muted)]"
            }`}
          >
            {formData.total_days > 0 ? `${formData.total_days} Days` : "-- Days"}
          </span>
        </div>
      </div>
    </div>
  );
}
