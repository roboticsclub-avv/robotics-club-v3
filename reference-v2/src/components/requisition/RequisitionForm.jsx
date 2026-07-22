"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import ProjectDetailsSection from "./ProjectDetailsSection";
import CascadingComponentSelector from "./CascadingComponentSelector";
import SelectedComponentsTable from "./SelectedComponentsTable";
import BorrowDurationPicker from "./BorrowDurationPicker";
import TermsAndSubmitSection from "./TermsAndSubmitSection";
import { validateRequisitionForm, generateTempRequestId } from "@/schemas/requisition.schema";
import { generateRequisitionPDF } from "@/lib/pdf/generateRequisitionPDF";
import Link from "next/link";

const stepVariants = {
  initial: { opacity: 0, x: 25, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, x: -25, scale: 0.98, transition: { duration: 0.25 } },
};

export default function RequisitionForm({ isEmbedded = false }) {
  const router = useRouter();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [existingPendingRequest, setExistingPendingRequest] = useState(null);
  const [checkingPending, setCheckingPending] = useState(true);

  const [formData, setFormData] = useState({
    project_title: "",
    project_desc: "",
    faculty_mentor: "",
    project_type: "",
    expected_outcome: "",
    purpose: "",
    takeaway_date: "",
    return_date: "",
    total_days: 0,
    agreedToPolicies: false,
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [activeComponent, setActiveComponent] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);

  // Check Duplicate Request Protection on mount
  useEffect(() => {
    const checkPendingRequests = async () => {
      if (!user?.id) {
        setCheckingPending(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("hardware_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (data) {
          setExistingPendingRequest(data);
        }
      } catch (err) {
        console.error("Error checking pending hardware requests:", err);
      } finally {
        setCheckingPending(false);
      }
    };

    checkPendingRequests();
  }, [user]);

  // Handle Add Component to selected items array
  const handleAddComponent = (newItem) => {
    setSelectedItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === newItem.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].qty += newItem.qty;
        return updated;
      }
      return [...prev, newItem];
    });
    setErrors((prev) => ({ ...prev, items: null }));
  };

  // Step Validation & Navigation Logic
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.project_title?.trim()) newErrors.project_title = "Project Title is required.";
    if (!formData.project_type) newErrors.project_type = "Project Type is required.";
    if (!formData.project_desc?.trim()) newErrors.project_desc = "Project Description is required.";
    if (!formData.purpose?.trim()) newErrors.purpose = "Purpose of Hardware is required.";
    if (!formData.expected_outcome?.trim()) newErrors.expected_outcome = "Expected Outcome is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (selectedItems.length === 0) {
      setErrors({ items: "Please add at least one hardware component to your requisition list." });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === 1) {
      setCurrentStep(1);
    } else if (targetStep === 2) {
      if (validateStep1()) setCurrentStep(2);
    } else if (targetStep === 3) {
      if (validateStep1() && validateStep2()) setCurrentStep(3);
    }
  };

  // Handle Form Submission
  const handleSubmit = async () => {
    // 1. Validation
    const validation = validateRequisitionForm(formData, selectedItems);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const tempId = generateTempRequestId();

      // Silently populate authenticated member details in background payload
      const requestPayload = {
        temp_request_id: tempId,
        user_id: user.id,
        user_name: profile?.name || user.email?.split("@")[0] || "Member",
        member_id: profile?.memberId || profile?.member_id || "N/A",
        roll_number: profile?.roll_number || profile?.memberId || "N/A",
        department: profile?.branch || profile?.department || "N/A",
        section: profile?.section || "A",
        year: profile?.year || "1",
        email: profile?.email || user.email,
        phone: profile?.phone || "N/A",
        photo_url: profile?.photoURL || "",
        project_title: formData.project_title,
        project_desc: formData.project_desc,
        faculty_mentor: formData.faculty_mentor || null,
        project_type: formData.project_type,
        expected_outcome: formData.expected_outcome,
        purpose: formData.purpose,
        takeaway_date: formData.takeaway_date,
        return_date: formData.return_date,
        total_days: formData.total_days,
        status: "pending",
      };

      // 2. Insert into hardware_requests table
      const { data: requestData, error: reqError } = await supabase
        .from("hardware_requests")
        .insert(requestPayload)
        .select()
        .single();

      if (reqError) throw reqError;

      // 3. Insert items into hardware_request_items table with audit snapshot
      const itemsPayload = selectedItems.map((item) => ({
        request_id: requestData.id,
        hardware_id: item.hardware_id || item.id,
        hardware_name: item.name,
        qty: item.qty,
        available_at_request_time: item.available_at_request_time || item.availableQuantity || 0, // Audit snapshot
        remarks: item.remarks || "",
      }));

      const { error: itemsError } = await supabase
        .from("hardware_request_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      // 4. Generate & Download PDF Automatically
      await generateRequisitionPDF(requestPayload, selectedItems);

      setSuccessPayload(requestPayload);
    } catch (err) {
      console.error("Requisition submission error:", err);
      alert("Failed to submit requisition: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingPending) {
    return (
      <div className="py-16 text-center space-y-4 font-inter">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
        <p className="text-xs font-mono text-gray-400">Verifying session & inventory status...</p>
      </div>
    );
  }

  // Duplicate Request Protection Display
  if (existingPendingRequest) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6 font-inter">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto">
            ⏳
          </div>
          <h2 className="text-lg font-bold font-orbitron text-amber-300">
            ACTIVE PENDING REQUISITION DETECTED
          </h2>
          <p className="text-xs text-gray-300 max-w-xl mx-auto leading-relaxed">
            You currently have an active hardware request{" "}
            <span className="font-mono text-amber-400 font-bold">
              {existingPendingRequest.temp_request_id}
            </span>{" "}
            submitted on {new Date(existingPendingRequest.created_at).toLocaleDateString("en-IN")}{" "}
            which is pending administrator approval.
          </p>
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.04] text-xs text-gray-400 font-mono text-left max-w-md mx-auto space-y-1">
            <div>Project: {existingPendingRequest.project_title}</div>
            <div>Takeaway Date: {existingPendingRequest.takeaway_date}</div>
            <div>Status: Pending Admin Review</div>
          </div>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/member"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-orbitron transition shadow-lg shadow-purple-600/20"
            >
              GO TO MEMBER PORTAL
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success Screen After Submission
  if (successPayload) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6 font-inter text-center">
        <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-3xl mx-auto border border-purple-500/30">
            🎉
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-orbitron text-white">
              HARDWARE REQUEST SUBMITTED SUCCESSFULLY!
            </h2>
            <p className="text-xs text-gray-300 max-w-lg mx-auto">
              Your temporary requisition ID is{" "}
              <span className="font-mono text-purple-400 font-bold text-sm">
                {successPayload.temp_request_id}
              </span>
              . The official PDF requisition form has been generated and downloaded to your device.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-gray-300 font-mono text-left max-w-md mx-auto space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Temporary ID:</span>
              <span className="text-purple-400 font-bold">{successPayload.temp_request_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Final Requisition ID:</span>
              <span className="text-amber-400 font-bold">Assigned Upon Approval</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="text-teal-400 font-bold">Pending Admin Approval</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => generateRequisitionPDF(successPayload, selectedItems)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs font-mono transition border border-white/20"
            >
              📄 Download PDF Again
            </button>

            <Link
              href="/member"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-orbitron transition shadow-lg shadow-purple-600/20"
            >
              TRACK IN MEMBER PORTAL →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active component manual calculation
  const displayManualComponent = activeComponent || (selectedItems.length > 0 ? selectedItems[selectedItems.length - 1] : null);
  const totalHardwareQty = selectedItems.reduce((acc, i) => acc + (i.qty || 1), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-inter px-2 sm:px-4">
      {/* Page Title Header (rendered when standalone / non-embedded) */}
      {!isEmbedded && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-300 to-indigo-400">
            HARDWARE REQUISITION PORTAL
          </h1>
          <p className="text-xs text-gray-400 max-w-xl mx-auto">
            Request hardware components, sensors, and microcontrollers for your robotics projects.
            Generated requests require administrator sign-off prior to physical takeaway.
          </p>
        </div>
      )}

      {/* Multi-Step Wizard Floating Glass Container */}
      <div className="relative bg-[#111115]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden space-y-8">
        {/* Glow Accent Background Lights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Professional Animated Progress Stepper */}
        <div className="w-full relative z-10">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            {/* Background Connector Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0 rounded-full" />
            {/* Animated Active Connector Line */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-500 via-teal-400 to-indigo-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-out"
              style={{
                width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
              }}
            />

            {/* Step 1 Button */}
            <button
              type="button"
              onClick={() => handleStepClick(1)}
              className="relative z-10 flex flex-col items-center group focus:outline-none cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-orbitron font-bold text-xs transition-all duration-300 ${
                  currentStep === 1
                    ? "bg-purple-600 text-white shadow-[0_0_20px_#a855f7] border-2 border-purple-300 scale-110"
                    : currentStep > 1
                    ? "bg-teal-500 text-black font-extrabold shadow-[0_0_12px_#14b8a6]"
                    : "bg-[#16161c] text-gray-500 border border-white/10"
                }`}
              >
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <span
                className={`text-[11px] font-orbitron font-semibold mt-2 transition-colors ${
                  currentStep === 1 ? "text-purple-400 font-bold" : currentStep > 1 ? "text-teal-300" : "text-gray-500"
                }`}
              >
                ① Project
              </span>
            </button>

            {/* Step 2 Button */}
            <button
              type="button"
              onClick={() => handleStepClick(2)}
              className="relative z-10 flex flex-col items-center group focus:outline-none cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-orbitron font-bold text-xs transition-all duration-300 ${
                  currentStep === 2
                    ? "bg-purple-600 text-white shadow-[0_0_20px_#a855f7] border-2 border-purple-300 scale-110"
                    : currentStep > 2
                    ? "bg-teal-500 text-black font-extrabold shadow-[0_0_12px_#14b8a6]"
                    : "bg-[#16161c] text-gray-500 border border-white/10"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <span
                className={`text-[11px] font-orbitron font-semibold mt-2 transition-colors ${
                  currentStep === 2 ? "text-purple-400 font-bold" : currentStep > 2 ? "text-teal-300" : "text-gray-500"
                }`}
              >
                ② Components
              </span>
            </button>

            {/* Step 3 Button */}
            <button
              type="button"
              onClick={() => handleStepClick(3)}
              className="relative z-10 flex flex-col items-center group focus:outline-none cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-orbitron font-bold text-xs transition-all duration-300 ${
                  currentStep === 3
                    ? "bg-purple-600 text-white shadow-[0_0_20px_#a855f7] border-2 border-purple-300 scale-110"
                    : "bg-[#16161c] text-gray-500 border border-white/10"
                }`}
              >
                3
              </div>
              <span
                className={`text-[11px] font-orbitron font-semibold mt-2 transition-colors ${
                  currentStep === 3 ? "text-purple-400 font-bold" : "text-gray-500"
                }`}
              >
                ③ Borrow & Submit
              </span>
            </button>
          </div>
        </div>

        {/* Animated Step Wizard Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Project Information */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 relative z-10"
            >
              <ProjectDetailsSection
                formData={formData}
                setFormData={setFormData}
                errors={errors}
              />

              {/* Step 1 Bottom Action Bar */}
              <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-orbitron tracking-widest transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 group cursor-pointer"
                >
                  <span>CONTINUE TO COMPONENT SELECTION</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Component Selection & Inventory */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 relative z-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: Component Catalog & Table */}
                <div className="lg:col-span-2 space-y-6">
                  <CascadingComponentSelector
                    onAddComponent={handleAddComponent}
                    selectedItems={selectedItems}
                    onActiveComponentChange={setActiveComponent}
                  />

                  <SelectedComponentsTable
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
                    errorMsg={errors.items}
                  />
                </div>

                {/* Right: Floating Request Summary Card for Step 2 */}
                <div className="lg:col-span-1 space-y-5 bg-[#0e0e12]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-orbitron text-xs font-bold text-gray-200 tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
                      Hardware Request Summary
                    </h3>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs flex items-center justify-between font-mono">
                    <span className="text-gray-400 text-[11px]">Status:</span>
                    <span className="text-purple-400 font-bold text-[11px]">Pending Approval</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                      <span>Unique Components:</span>
                      <span className="text-white font-bold">{selectedItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                      <span>Total Units Requested:</span>
                      <span className="text-purple-300 font-bold">{totalHardwareQty}</span>
                    </div>

                    {selectedItems.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pt-2 pr-1 text-[11px]">
                        {selectedItems.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveComponent(item)}
                            className={`flex justify-between items-center bg-black/40 p-2 rounded-lg border transition cursor-pointer ${
                              displayManualComponent?.id === item.id
                                ? "border-purple-500/40 bg-purple-950/20"
                                : "border-white/[0.04] hover:border-white/10"
                            }`}
                          >
                            <span className="text-gray-200 font-medium truncate max-w-[130px]" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-purple-400 font-mono font-bold">×{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center space-y-2 bg-black/30 my-2">
                        <div className="text-3xl">📦</div>
                        <p className="text-xs font-bold text-gray-300 font-orbitron">No hardware selected</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Select components from the inventory to build your requisition.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 Bottom Navigation Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs font-orbitron transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  ← BACK TO PROJECT INFO
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={selectedItems.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-orbitron tracking-widest transition-all shadow-lg shadow-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>CONTINUE TO BORROW & SUBMIT</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Borrow Duration, Policies & Final Submit */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 relative z-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: Schedule & Regulations */}
                <div className="lg:col-span-2 space-y-6">
                  <BorrowDurationPicker
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                  />

                  <TermsAndSubmitSection
                    formData={formData}
                    setFormData={setFormData}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    errors={errors}
                  />
                </div>

                {/* Right: Final Floating Request Summary Card */}
                <div className="lg:col-span-1 space-y-5 bg-[#0e0e12]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-orbitron text-xs font-bold text-gray-200 tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
                      Hardware Request Summary
                    </h3>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs flex items-center justify-between font-mono">
                    <span className="text-gray-400 text-[11px]">Current Status:</span>
                    <span className="text-purple-400 font-bold text-[11px]">Pending Approval</span>
                  </div>

                  {/* Project Name Summary */}
                  {formData.project_title && (
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5 text-xs">
                      <span className="text-[10px] text-gray-500 font-mono block">Project:</span>
                      <p className="text-gray-200 font-semibold truncate" title={formData.project_title}>
                        {formData.project_title}
                      </p>
                    </div>
                  )}

                  {/* Selected Components List */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                      <span>Selected Items:</span>
                      <span className="text-white font-bold">{selectedItems.length} ({totalHardwareQty} units)</span>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1 pr-1 text-[11px]">
                      {selectedItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveComponent(item)}
                          className={`flex justify-between items-center bg-black/40 p-2 rounded-lg border transition cursor-pointer ${
                            displayManualComponent?.id === item.id
                              ? "border-purple-500/40 bg-purple-950/20"
                              : "border-white/[0.04] hover:border-white/10"
                          }`}
                        >
                          <span className="text-gray-200 font-medium truncate max-w-[120px]" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-purple-400 font-mono font-bold">×{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Borrow Duration Summary */}
                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                    <span className="text-gray-400 font-mono block text-[11px]">Borrow Schedule:</span>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Takeaway:</span>
                        <span className="text-gray-300 font-mono">{formData.takeaway_date || "Not Set"}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Return:</span>
                        <span className="text-gray-300 font-mono">{formData.return_date || "Not Set"}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1.5 border-t border-white/5 font-orbitron font-bold">
                        <span className="text-gray-400">Total Duration:</span>
                        <span className={formData.total_days > 0 ? "text-purple-400" : "text-gray-600"}>
                          {formData.total_days > 0 ? `${formData.total_days} Days` : "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Component Manual Card */}
                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                    <span className="text-gray-400 font-mono block text-[11px]">Current Component Manual:</span>
                    {displayManualComponent ? (
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-2">
                        <div className="text-[11px] font-semibold text-gray-200 truncate" title={displayManualComponent.name}>
                          {displayManualComponent.name}
                        </div>
                        {displayManualComponent.manual_url ? (
                          <div className="flex flex-col gap-1.5">
                            <a
                              href={displayManualComponent.manual_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full text-center px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition flex items-center justify-center gap-1"
                            >
                              📄 View Manual
                            </a>
                            <a
                              href={displayManualComponent.manual_url}
                              download
                              className="w-full text-center px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[11px] font-medium transition flex items-center justify-center gap-1"
                            >
                              ⬇ Download Manual
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-purple-300/80 block italic">
                            User Manual Coming Soon
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-500 italic">
                        User Manual Coming Soon
                      </div>
                    )}
                  </div>

                  {/* Registered Profile Notice */}
                  <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/10 text-[10px] text-purple-300/80 leading-normal font-mono">
                    💡 Your registered profile details will automatically be included in the generated requisition.
                  </div>

                  {/* Single Primary Submit Action Button */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!formData.agreedToPolicies || selectedItems.length === 0 || submitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-orbitron tracking-wider transition-all shadow-lg shadow-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          GENERATING...
                        </>
                      ) : (
                        <>
                          📄 GENERATE HARDWARE REQUEST
                        </>
                      )}
                    </button>

                    {!formData.agreedToPolicies && (
                      <p className="text-[10px] text-amber-400/80 text-center font-mono">
                        * Must accept hardware policies to generate request
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3 Bottom Navigation Bar */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs font-orbitron transition border border-white/10 flex items-center gap-2 cursor-pointer"
                >
                  ← BACK TO COMPONENT SELECTION
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
