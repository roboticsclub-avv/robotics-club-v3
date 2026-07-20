"use client";

import React, { useState } from "react";

export default function TermsAndSubmitSection({
  formData,
  setFormData,
  submitting,
  onSubmit,
  errors,
}) {
  const [agreed, setAgreed] = useState(false);

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setAgreed(isChecked);
    setFormData((prev) => ({ ...prev, agreedToPolicies: isChecked }));
  };

  return (
    <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6 font-inter">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="font-orbitron text-sm font-bold text-gray-200 tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          TERMS, HARDWARE POLICIES & SUBMISSION
        </h3>
      </div>

      {/* Terms & Usage Policies */}
      <div className="bg-black/40 border border-white/[0.04] rounded-xl p-4 space-y-3 text-xs text-gray-300 max-h-40 overflow-y-auto">
        <h4 className="font-bold text-white font-mono">Robotics Club Hardware Usage Regulations:</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-400 leading-relaxed">
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
          checked={agreed}
          onChange={handleCheckboxChange}
          className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="policy-consent" className="text-xs text-gray-300 cursor-pointer select-none">
          I have read and agree to all <span className="text-purple-400 font-semibold">Robotics Club Hardware Usage Policies</span>. I accept full responsibility for the proper care and timely return of all issued components.
        </label>
      </div>
      {errors?.agreedToPolicies && (
        <p className="text-xs text-red-400">{errors.agreedToPolicies}</p>
      )}

      {/* Generate Request & PDF Download Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06]">
        <div className="text-xs text-gray-500 font-mono">
          Status upon submission: <span className="text-purple-400 font-bold">Pending Approval</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!agreed || submitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-orbitron tracking-widest transition-all shadow-lg shadow-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              GENERATING REQUEST & PDF...
            </>
          ) : (
            <>
              📄 GENERATE HARDWARE REQUEST & DOWNLOAD PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
