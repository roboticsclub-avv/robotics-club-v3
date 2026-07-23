"use client";

import React from "react";

export default function TermsAndSubmitSection({
  formData,
  setFormData,
  submitting,
  onSubmit,
  errors,
}) {
  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setFormData((prev) => ({ ...prev, agreedToPolicies: isChecked }));
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 font-inter">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
        <h3 className="font-orbitron text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-wider flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-orange)]" />
          TERMS & HARDWARE USAGE POLICIES
        </h3>
      </div>

      {/* Terms & Usage Policies */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl p-4 sm:p-5 space-y-3 text-xs sm:text-sm text-[var(--text-primary)] max-h-44 overflow-y-auto">
        <h4 className="font-bold text-[var(--text-primary)] font-mono text-sm">Robotics Club Hardware Usage Regulations:</h4>
        <ul className="list-disc list-inside space-y-1.5 text-[var(--text-secondary)] leading-relaxed font-inter">
          <li>Requisitioned hardware must be used strictly for approved club or academic project activities.</li>
          <li>Members are held personally accountable for hardware condition. Damage due to miswiring, overvoltage, or short-circuiting must be reported immediately.</li>
          <li>Components must be returned on or before the specified Expected Return Date. Overdue items will restrict future requisitions.</li>
          <li>Hardware cannot be transferred to non-club members without prior written approval from the Hardware Manager.</li>
          <li>The generated PDF requisition copy must be presented during physical component takeaway.</li>
        </ul>
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="policy-consent"
          checked={!!formData.agreedToPolicies}
          onChange={handleCheckboxChange}
          className="mt-1 w-5 h-5 rounded border-[var(--border-card)] bg-[var(--bg-secondary)] text-[var(--accent-purple)] focus:ring-[var(--accent-purple)] cursor-pointer"
        />
        <label htmlFor="policy-consent" className="text-xs sm:text-sm text-[var(--text-primary)] cursor-pointer select-none leading-relaxed font-inter">
          I have read and agree to all <span className="text-[var(--accent-purple)] font-semibold">Robotics Club Hardware Usage Policies</span>. I accept full financial and disciplinary responsibility for the proper care and timely return of all issued components.
        </label>
      </div>
      {errors?.agreedToPolicies && (
        <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.agreedToPolicies}</p>
      )}
    </div>
  );
}
