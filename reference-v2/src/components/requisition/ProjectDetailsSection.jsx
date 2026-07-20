"use client";

import React from "react";
import { REQUISITION_LIMITS, PROJECT_TYPES } from "@/schemas/requisition.schema";

export default function ProjectDetailsSection({ formData, setFormData, errors }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6 font-inter">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="font-orbitron text-sm font-bold text-gray-200 tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          PROJECT & RESEARCH INFORMATION
        </h3>
        <span className="text-xs text-gray-500">Step 1 of 3</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Title */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="text-gray-300 font-medium">
              Project Title <span className="text-red-400">*</span>
            </label>
            <span className="text-gray-500 font-mono">
              {(formData.project_title || "").length} / {REQUISITION_LIMITS.PROJECT_TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            maxLength={REQUISITION_LIMITS.PROJECT_TITLE_MAX}
            placeholder="e.g. Autonomous Maze Solving Micromouse Robot"
            value={formData.project_title || ""}
            onChange={(e) => handleChange("project_title", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          />
          {errors?.project_title && (
            <p className="text-xs text-red-400">{errors.project_title}</p>
          )}
        </div>

        {/* Project Type Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium block">
            Project Type <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.project_type || ""}
            onChange={(e) => handleChange("project_type", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          >
            <option value="" disabled className="bg-gray-900 text-gray-400">
              -- Select Project Category --
            </option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type} className="bg-gray-900 text-white">
                {type}
              </option>
            ))}
          </select>
          {errors?.project_type && (
            <p className="text-xs text-red-400">{errors.project_type}</p>
          )}
        </div>

        {/* Faculty Mentor */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="text-gray-300 font-medium">
              Faculty Mentor <span className="text-gray-500">(Optional)</span>
            </label>
            <span className="text-gray-500 font-mono">
              {(formData.faculty_mentor || "").length} / {REQUISITION_LIMITS.FACULTY_MENTOR_MAX}
            </span>
          </div>
          <input
            type="text"
            maxLength={REQUISITION_LIMITS.FACULTY_MENTOR_MAX}
            placeholder="e.g. Dr. Rajesh Kumar (Dept. of Robotics)"
            value={formData.faculty_mentor || ""}
            onChange={(e) => handleChange("faculty_mentor", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* Project Description */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="text-gray-300 font-medium">
              Project Description <span className="text-red-400">*</span>
            </label>
            <span className="text-gray-500 font-mono">
              {(formData.project_desc || "").length} / {REQUISITION_LIMITS.PROJECT_DESC_MAX}
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={REQUISITION_LIMITS.PROJECT_DESC_MAX}
            placeholder="Provide a concise summary of the project scope, technical approach, and key milestones..."
            value={formData.project_desc || ""}
            onChange={(e) => handleChange("project_desc", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition resize-none"
          />
          {errors?.project_desc && (
            <p className="text-xs text-red-400">{errors.project_desc}</p>
          )}
        </div>

        {/* Purpose of Hardware */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="text-gray-300 font-medium">
              Purpose of Hardware <span className="text-red-400">*</span>
            </label>
            <span className="text-gray-500 font-mono">
              {(formData.purpose || "").length} / {REQUISITION_LIMITS.PURPOSE_MAX}
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={REQUISITION_LIMITS.PURPOSE_MAX}
            placeholder="Explain why these specific components are required for the project..."
            value={formData.purpose || ""}
            onChange={(e) => handleChange("purpose", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition resize-none"
          />
          {errors?.purpose && (
            <p className="text-xs text-red-400">{errors.purpose}</p>
          )}
        </div>

        {/* Expected Outcome */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="text-gray-300 font-medium">
              Expected Outcome <span className="text-red-400">*</span>
            </label>
            <span className="text-gray-500 font-mono">
              {(formData.expected_outcome || "").length} / {REQUISITION_LIMITS.EXPECTED_OUTCOME_MAX}
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={REQUISITION_LIMITS.EXPECTED_OUTCOME_MAX}
            placeholder="Describe the physical deliverable or test results expected upon completion..."
            value={formData.expected_outcome || ""}
            onChange={(e) => handleChange("expected_outcome", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition resize-none"
          />
          {errors?.expected_outcome && (
            <p className="text-xs text-red-400">{errors.expected_outcome}</p>
          )}
        </div>
      </div>
    </div>
  );
}
