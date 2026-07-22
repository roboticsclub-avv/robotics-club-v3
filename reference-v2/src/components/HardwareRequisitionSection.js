"use client";

import React from "react";
import RequisitionForm from "./requisition/RequisitionForm";

export default function HardwareRequisitionSection() {
  return (
    <section className="section py-16 md:py-24 relative overflow-hidden" id="requisition">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="section-label text-purple-400 font-orbitron text-xs tracking-widest uppercase font-bold block">
            HARDWARE REQUISITION PORTAL
          </span>
          <h2 className="section-title text-2xl sm:text-4xl font-extrabold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-300 to-indigo-400">
            Request Components & Equipment
          </h2>
          <p className="section-description text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
            Request hardware components, microcontrollers, and sensors for your robotics projects.
            Your registered profile details will automatically be included in the generated requisition.
          </p>
        </div>

        <RequisitionForm isEmbedded={true} />
      </div>
    </section>
  );
}
