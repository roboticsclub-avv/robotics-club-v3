"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const wizardRef = useRef(null);

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

  // Smooth scroll to wizard container without sending browser to top of page
  const scrollToWizardContainer = () => {
    if (wizardRef.current) {
      const rect = wizardRef.current.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.4) {
        wizardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
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
        scrollToWizardContainer();
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        scrollToWizardContainer();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      scrollToWizardContainer();
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === 1) {
      setCurrentStep(1);
      scrollToWizardContainer();
    } else if (targetStep === 2) {
      if (validateStep1()) {
        setCurrentStep(2);
        scrollToWizardContainer();
      }
    } else if (targetStep === 3) {
      if (validateStep1() && validateStep2()) {
        setCurrentStep(3);
        scrollToWizardContainer();
      }
    }
  };

  // Handle Form Submission
  const handleSubmit = async () => {
    const validation = validateRequisitionForm(formData, selectedItems);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const tempId = generateTempRequestId();

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

      const { data: requestData, error: reqError } = await supabase
        .from("hardware_requests")
        .insert(requestPayload)
        .select()
        .single();

      if (reqError) throw reqError;

      const itemsPayload = selectedItems.map((item) => ({
        request_id: requestData.id,
        hardware_id: item.hardware_id || item.id,
        hardware_name: item.name,
        qty: item.qty,
        available_at_request_time: item.available_at_request_time || item.availableQuantity || 0,
        remarks: item.remarks || "",
      }));

      const { error: itemsError } = await supabase
        .from("hardware_request_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

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
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-purple)]/30 border-t-[var(--accent-purple)] animate-spin mx-auto" />
        <p className="text-xs sm:text-sm font-mono text-[var(--text-secondary)]">Verifying session & inventory status...</p>
      </div>
    );
  }

  // Duplicate Request Protection Display
  if (existingPendingRequest) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6 font-inter">
        <div className="glass-card p-8 rounded-2xl shadow-xl space-y-4 text-center border-[var(--border-card)]">
          <div className="w-14 h-14 rounded-full bg-[var(--accent-orange-glow)] text-[var(--accent-orange)] flex items-center justify-center text-3xl mx-auto border border-[var(--accent-orange)]/30">
            ⏳
          </div>
          <h2 className="text-xl font-bold font-orbitron text-[var(--accent-orange)]">
            ACTIVE PENDING REQUISITION DETECTED
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            You currently have an active hardware request{" "}
            <span className="font-mono text-[var(--accent-purple)] font-bold">
              {existingPendingRequest.temp_request_id}
            </span>{" "}
            submitted on {new Date(existingPendingRequest.created_at).toLocaleDateString("en-IN")}{" "}
            which is pending administrator approval.
          </p>
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-card)] text-xs sm:text-sm text-[var(--text-primary)] font-mono text-left max-w-md mx-auto space-y-1.5">
            <div><span className="text-[var(--text-muted)]">Project:</span> {existingPendingRequest.project_title}</div>
            <div><span className="text-[var(--text-muted)]">Takeaway Date:</span> {existingPendingRequest.takeaway_date}</div>
            <div><span className="text-[var(--text-muted)]">Status:</span> Pending Admin Review</div>
          </div>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/member"
              className="px-6 py-3 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-bold text-xs sm:text-sm font-orbitron transition shadow-lg shadow-[var(--accent-purple-glow)]"
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
        <div className="glass-card p-8 rounded-2xl shadow-2xl space-y-6 border-[var(--border-card)]">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-teal-glow)] text-[var(--accent-teal)] flex items-center justify-center text-3xl mx-auto border border-[var(--accent-teal)]/30">
            🎉
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-orbitron text-[var(--text-primary)]">
              HARDWARE REQUEST SUBMITTED SUCCESSFULLY!
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
              Your temporary requisition ID is{" "}
              <span className="font-mono text-[var(--accent-purple)] font-bold text-base">
                {successPayload.temp_request_id}
              </span>
              . The official PDF requisition form has been generated and downloaded to your device.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-card)] text-xs sm:text-sm text-[var(--text-primary)] font-mono text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Temporary ID:</span>
              <span className="text-[var(--accent-purple)] font-bold">{successPayload.temp_request_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Final Requisition ID:</span>
              <span className="text-[var(--accent-orange)] font-bold">Assigned Upon Approval</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Status:</span>
              <span className="text-[var(--accent-teal)] font-bold">Pending Admin Approval</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => generateRequisitionPDF(successPayload, selectedItems)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-medium text-xs sm:text-sm font-mono transition border border-[var(--border-card)]"
            >
              📄 Download PDF Again
            </button>

            <Link
              href="/member"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-bold text-xs sm:text-sm font-orbitron transition shadow-lg shadow-[var(--accent-purple-glow)]"
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
    <div ref={wizardRef} className="space-y-8 max-w-6xl mx-auto font-inter px-2 sm:px-4 scroll-mt-28">
      {/* Page Title Header (rendered when standalone / non-embedded) */}
      {!isEmbedded && (
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-orbitron text-[var(--text-primary)] tracking-tight">
            HARDWARE REQUISITION PORTAL
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto font-inter">
            Request hardware components, sensors, and microcontrollers for your robotics projects.
            Generated requests require administrator sign-off prior to physical takeaway.
          </p>
        </div>
      )}

      {/* Multi-Step Wizard Floating Glass Container */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8 border-[var(--border-card)]">
        {/* Professional Animated Progress Stepper */}
        <div className="w-full relative z-10">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            {/* Background Connector Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--border-card)] -translate-y-1/2 z-0 rounded-full" />
            {/* Animated Active Connector Line */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-[var(--accent-purple)] -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-out"
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
                className={`w-11 h-11 rounded-full flex items-center justify-center font-orbitron font-bold text-sm transition-all duration-300 ${
                  currentStep === 1
                    ? "bg-[var(--accent-purple)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-purple-glow)] border-2 border-[var(--text-primary)] scale-110"
                    : currentStep > 1
                    ? "bg-[var(--accent-teal)] text-[var(--bg-primary)] font-extrabold shadow-md shadow-[var(--accent-teal-glow)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-card)]"
                }`}
              >
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <span
                className={`text-xs sm:text-sm font-orbitron font-semibold mt-2 transition-colors ${
                  currentStep === 1
                    ? "text-[var(--accent-purple)] font-bold"
                    : currentStep > 1
                    ? "text-[var(--accent-teal)]"
                    : "text-[var(--text-muted)]"
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
                className={`w-11 h-11 rounded-full flex items-center justify-center font-orbitron font-bold text-sm transition-all duration-300 ${
                  currentStep === 2
                    ? "bg-[var(--accent-purple)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-purple-glow)] border-2 border-[var(--text-primary)] scale-110"
                    : currentStep > 2
                    ? "bg-[var(--accent-teal)] text-[var(--bg-primary)] font-extrabold shadow-md shadow-[var(--accent-teal-glow)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-card)]"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <span
                className={`text-xs sm:text-sm font-orbitron font-semibold mt-2 transition-colors ${
                  currentStep === 2
                    ? "text-[var(--accent-purple)] font-bold"
                    : currentStep > 2
                    ? "text-[var(--accent-teal)]"
                    : "text-[var(--text-muted)]"
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
                className={`w-11 h-11 rounded-full flex items-center justify-center font-orbitron font-bold text-sm transition-all duration-300 ${
                  currentStep === 3
                    ? "bg-[var(--accent-purple)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-purple-glow)] border-2 border-[var(--text-primary)] scale-110"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-card)]"
                }`}
              >
                3
              </div>
              <span
                className={`text-xs sm:text-sm font-orbitron font-semibold mt-2 transition-colors ${
                  currentStep === 3 ? "text-[var(--accent-purple)] font-bold" : "text-[var(--text-muted)]"
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
              <div className="flex justify-end pt-6 border-t border-[var(--border-card)]">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-3.5 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-bold text-xs sm:text-sm font-orbitron tracking-widest transition-all shadow-lg shadow-[var(--accent-purple-glow)] flex items-center gap-2 group cursor-pointer active:scale-[0.98]"
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
                <div className="lg:col-span-1 space-y-5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
                    <h3 className="font-orbitron text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-purple)] animate-pulse" />
                      Hardware Request Summary
                    </h3>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--accent-purple-glow)] border border-[var(--border-card)] text-xs sm:text-sm flex items-center justify-between font-mono">
                    <span className="text-[var(--text-secondary)]">Status:</span>
                    <span className="text-[var(--accent-purple)] font-bold">Pending Approval</span>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-[var(--text-secondary)] font-mono">
                      <span>Unique Components:</span>
                      <span className="text-[var(--text-primary)] font-bold">{selectedItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[var(--text-secondary)] font-mono">
                      <span>Total Units Requested:</span>
                      <span className="text-[var(--accent-teal)] font-bold">{totalHardwareQty}</span>
                    </div>

                    {selectedItems.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pt-2 pr-1 text-xs sm:text-sm">
                        {selectedItems.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveComponent(item)}
                            className={`flex justify-between items-center bg-[var(--bg-secondary)] p-2.5 rounded-xl border transition cursor-pointer ${
                              displayManualComponent?.id === item.id
                                ? "border-[var(--accent-purple)] bg-[var(--accent-purple-glow)]"
                                : "border-[var(--border-card)] hover:border-[var(--text-secondary)]"
                            }`}
                          >
                            <span className="text-[var(--text-primary)] font-medium truncate max-w-[130px]" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[var(--accent-purple)] font-mono font-bold">×{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border border-dashed border-[var(--border-card)] text-center space-y-2 bg-[var(--bg-secondary)] my-2">
                        <div className="text-3xl">📦</div>
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-orbitron">No hardware selected</p>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          Select components from the inventory to build your requisition.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 Bottom Navigation Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border-card)]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-medium text-xs sm:text-sm font-orbitron transition border border-[var(--border-card)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  ← BACK TO PROJECT INFO
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={selectedItems.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-bold text-xs sm:text-sm font-orbitron tracking-widest transition-all shadow-lg shadow-[var(--accent-purple-glow)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
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
                <div className="lg:col-span-1 space-y-5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
                    <h3 className="font-orbitron text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-purple)] animate-pulse" />
                      Hardware Request Summary
                    </h3>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--accent-purple-glow)] border border-[var(--border-card)] text-xs sm:text-sm flex items-center justify-between font-mono">
                    <span className="text-[var(--text-secondary)]">Current Status:</span>
                    <span className="text-[var(--accent-purple)] font-bold">Pending Approval</span>
                  </div>

                  {/* Project Name Summary */}
                  {formData.project_title && (
                    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-card)] space-y-0.5 text-xs sm:text-sm">
                      <span className="text-xs text-[var(--text-muted)] font-mono block">Project:</span>
                      <p className="text-[var(--text-primary)] font-semibold truncate" title={formData.project_title}>
                        {formData.project_title}
                      </p>
                    </div>
                  )}

                  {/* Selected Components List */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-[var(--text-secondary)] font-mono">
                      <span>Selected Items:</span>
                      <span className="text-[var(--text-primary)] font-bold">{selectedItems.length} ({totalHardwareQty} units)</span>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1 pr-1">
                      {selectedItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveComponent(item)}
                          className={`flex justify-between items-center bg-[var(--bg-secondary)] p-2.5 rounded-xl border transition cursor-pointer ${
                            displayManualComponent?.id === item.id
                              ? "border-[var(--accent-purple)] bg-[var(--accent-purple-glow)]"
                              : "border-[var(--border-card)] hover:border-[var(--text-secondary)]"
                          }`}
                        >
                          <span className="text-[var(--text-primary)] font-medium truncate max-w-[120px]" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[var(--accent-purple)] font-mono font-bold">×{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Borrow Duration Summary */}
                  <div className="pt-3 border-t border-[var(--border-card)] space-y-2 text-xs sm:text-sm">
                    <span className="text-[var(--text-secondary)] font-mono block">Borrow Schedule:</span>
                    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-card)] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Takeaway:</span>
                        <span className="text-[var(--text-primary)] font-mono">{formData.takeaway_date || "Not Set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Return:</span>
                        <span className="text-[var(--text-primary)] font-mono">{formData.return_date || "Not Set"}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[var(--border-card)] font-orbitron font-bold">
                        <span className="text-[var(--text-secondary)]">Total Duration:</span>
                        <span className={formData.total_days > 0 ? "text-[var(--accent-purple)]" : "text-[var(--text-muted)]"}>
                          {formData.total_days > 0 ? `${formData.total_days} Days` : "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Component Manual Card */}
                  <div className="pt-3 border-t border-[var(--border-card)] space-y-2 text-xs sm:text-sm">
                    <span className="text-[var(--text-secondary)] font-mono block">Current Component Manual:</span>
                    {displayManualComponent ? (
                      <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-card)] space-y-2">
                        <div className="font-semibold text-[var(--text-primary)] truncate" title={displayManualComponent.name}>
                          {displayManualComponent.name}
                        </div>
                        {displayManualComponent.manual_url ? (
                          <div className="flex flex-col gap-1.5">
                            <a
                              href={displayManualComponent.manual_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full text-center px-3 py-2 rounded-lg bg-[var(--accent-purple-glow)] hover:opacity-90 text-[var(--accent-purple)] border border-[var(--border-card)] font-medium transition flex items-center justify-center gap-1 text-xs"
                            >
                              📄 View Manual
                            </a>
                            <a
                              href={displayManualComponent.manual_url}
                              download
                              className="w-full text-center px-3 py-2 rounded-lg bg-[var(--accent-teal-glow)] hover:opacity-90 text-[var(--accent-teal)] border border-[var(--border-card)] font-medium transition flex items-center justify-center gap-1 text-xs"
                            >
                              ⬇ Download Manual
                            </a>
                          </div>
                        ) : (
                          <span className="font-mono text-[var(--text-muted)] block italic text-xs">
                            User Manual Coming Soon
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] italic">
                        User Manual Coming Soon
                      </div>
                    )}
                  </div>

                  {/* Registered Profile Notice */}
                  <div className="p-3 rounded-xl bg-[var(--accent-purple-glow)] border border-[var(--border-card)] text-xs text-[var(--accent-purple)] leading-normal font-mono">
                    💡 Your registered profile details will automatically be included in the generated requisition.
                  </div>

                  {/* Single Primary Submit Action Button */}
                  <div className="pt-3 border-t border-[var(--border-card)] space-y-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!formData.agreedToPolicies || selectedItems.length === 0 || submitting}
                      className="w-full py-4 px-4 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-bold text-xs sm:text-sm font-orbitron tracking-wider transition-all shadow-lg shadow-[var(--accent-purple-glow)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] animate-spin" />
                          GENERATING...
                        </>
                      ) : (
                        <>
                          📄 GENERATE HARDWARE REQUEST
                        </>
                      )}
                    </button>

                    {!formData.agreedToPolicies && (
                      <p className="text-xs text-[var(--accent-orange)] text-center font-mono">
                        * Must accept hardware policies to generate request
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3 Bottom Navigation Bar */}
              <div className="flex items-center justify-between pt-6 border-t border-[var(--border-card)]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-medium text-xs sm:text-sm font-orbitron transition border border-[var(--border-card)] flex items-center gap-2 cursor-pointer"
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
