"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import MemberProfileCard from "./MemberProfileCard";
import ProjectDetailsSection from "./ProjectDetailsSection";
import CascadingComponentSelector from "./CascadingComponentSelector";
import SelectedComponentsTable from "./SelectedComponentsTable";
import BorrowDurationPicker from "./BorrowDurationPicker";
import TermsAndSubmitSection from "./TermsAndSubmitSection";
import { validateRequisitionForm, generateTempRequestId } from "@/schemas/requisition.schema";
import { generateRequisitionPDF } from "@/lib/pdf/generateRequisitionPDF";
import Link from "next/link";

export default function RequisitionForm() {
  const router = useRouter();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();

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

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-300 to-indigo-400">
          HARDWARE REQUISITION PORTAL
        </h1>
        <p className="text-xs text-gray-400 max-w-xl mx-auto">
          Request hardware components, sensors, and microcontrollers for your robotics projects.
          Generated requests require administrator sign-off prior to physical takeaway.
        </p>
      </div>

      {/* Section 1: Member Profile */}
      <MemberProfileCard profile={profile} />

      {/* Section 2: Project Information */}
      <ProjectDetailsSection
        formData={formData}
        setFormData={setFormData}
        errors={errors}
      />

      {/* Section 3: Component Selection */}
      <CascadingComponentSelector
        onAddComponent={handleAddComponent}
        selectedItems={selectedItems}
      />

      {/* Section 4: Selected Components Table */}
      <SelectedComponentsTable
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        errorMsg={errors.items}
      />

      {/* Section 5: Borrow Duration Picker */}
      <BorrowDurationPicker
        formData={formData}
        setFormData={setFormData}
        errors={errors}
      />

      {/* Section 6: Terms & Submit */}
      <TermsAndSubmitSection
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        onSubmit={handleSubmit}
        errors={errors}
      />
    </div>
  );
}
