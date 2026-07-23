"use client";

import React from "react";
import { REQUISITION_LIMITS, PROJECT_TYPES } from "@/schemas/requisition.schema";

export default function ProjectDetailsSection({ formData, setFormData, errors }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 font-inter">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
        <h3 className="font-orbitron text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-wider flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-teal)] shadow-sm" />
          PROJECT & RESEARCH INFORMATION
        </h3>
        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">Step 1 of 3</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Title */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <label className="text-[var(--text-primary)] font-semibold font-inter">
              Project Title <span className="text-red-400">*</span>
            </label>
            <span className="text-[var(--text-secondary)] font-mono text-xs">
              {(formData.project_title || "").length} / {REQUISITION_LIMITS.PROJECT_TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            maxLength={REQUISITION_LIMITS.PROJECT_TITLE_MAX}
            placeholder="e.g. Autonomous Maze Solving Micromouse Robot"
            value={formData.project_title || ""}
            onChange={(e) => handleChange("project_title", e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200"
          />
          {errors?.project_title && (
            <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.project_title}</p>
          )}
        </div>

        {/* Project Type Dropdown */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold block font-inter">
            Project Type <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.project_type || ""}
            onChange={(e) => handleChange("project_type", e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200"
          >
            <option value="" disabled className="bg-[var(--bg-primary)] text-[var(--text-secondary)]">
              -- Select Project Category --
            </option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                {type}
              </option>
            ))}
          </select>
          {errors?.project_type && (
            <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.project_type}</p>
          )}
        </div>

        {/* Faculty Mentor */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <label className="text-[var(--text-primary)] font-semibold font-inter">
              Faculty Mentor <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <span className="text-[var(--text-secondary)] font-mono text-xs">
              {(formData.faculty_mentor || "").length} / {REQUISITION_LIMITS.FACULTY_MENTOR_MAX}
            </span>
          </div>
          <input
            type="text"
            maxLength={REQUISITION_LIMITS.FACULTY_MENTOR_MAX}
            placeholder="e.g. Dr. Rajesh Kumar (Dept. of Robotics)"
            value={formData.faculty_mentor || ""}
            onChange={(e) => handleChange("faculty_mentor", e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200"
          />
        </div>

        {/* Project Description */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <label className="text-[var(--text-primary)] font-semibold font-inter">
              Project Description <span className="text-red-400">*</span>
            </label>
            <span className="text-[var(--text-secondary)] font-mono text-xs">
              {(formData.project_desc || "").length} / {REQUISITION_LIMITS.PROJECT_DESC_MAX}
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={REQUISITION_LIMITS.PROJECT_DESC_MAX}
            placeholder="Provide a concise summary of the project scope, technical approach, and key milestones..."
            value={formData.project_desc || ""}
            onChange={(e) => handleChange("project_desc", e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200 resize-none"
          />
          {errors?.project_desc && (
            <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.project_desc}</p>
          )}
        </div>

        {/* Purpose of Hardware */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <label className="text-[var(--text-primary)] font-semibold font-inter">
              Purpose of Hardware <span className="text-red-400">*</span>
            </label>
            <span className="text-[var(--text-secondary)] font-mono text-xs">
              {(formData.purpose || "").length} / {REQUISITION_LIMITS.PURPOSE_MAX}
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={REQUISITION_LIMITS.PURPOSE_MAX}
            placeholder="Explain why these specific components are required for the project..."
            value={formData.purpose || ""}
            onChange={(e) => handleChange("purpose", e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200 resize-none"
          />
          {errors?.purpose && (
            <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.purpose}</p>
          )}
        </div>

        {/* Expected Outcome */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <label className="text-[var(--text-primary)] font-semibold font-inter">
              Expected Outcome <span className="text-red-400">*</span>
            </label>
            <span className="text-[var(--text-secondary)] font-mono text-xs">
              {(formData.expected_outcome || "").length} / {REQUISITION_LIMITS.EXPECTED_OUTCOME_MAX}
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={REQUISITION_LIMITS.EXPECTED_OUTCOME_MAX}
            placeholder="Describe the physical deliverable or test results expected upon completion..."
            value={formData.expected_outcome || ""}
            onChange={(e) => handleChange("expected_outcome", e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200 resize-none"
          />
          {errors?.expected_outcome && (
            <p className="text-xs sm:text-sm text-red-400 font-medium">{errors.expected_outcome}</p>
          )}
        </div>
      </div>
    </div>
  );
}
