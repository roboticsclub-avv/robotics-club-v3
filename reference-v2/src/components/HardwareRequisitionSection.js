"use client";

import React from "react";
import RequisitionForm from "./requisition/RequisitionForm";

export default function HardwareRequisitionSection() {
  return (
    <section className="section py-16 md:py-24 relative overflow-hidden" id="requisition">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="section-label font-orbitron text-xs sm:text-sm tracking-widest uppercase font-bold block text-[var(--accent-orange)]">
            HARDWARE REQUISITION PORTAL
          </span>
          <h2 className="section-title text-3xl sm:text-5xl font-extrabold font-orbitron text-[var(--text-primary)] tracking-tight">
            Request Components & Equipment
          </h2>
          <p className="section-description text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto font-inter">
            Request hardware components, microcontrollers, and sensors for your robotics projects.
            Your registered profile details will automatically be included in the generated requisition.
          </p>
        </div>

        <RequisitionForm isEmbedded={true} />
      </div>
    </section>
  );
}
