"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { validateRecruitmentField } from "@/schemas/user.schema";
import FormProgress from "./FormProgress";
import SuccessScreen from "./SuccessScreen";
import Link from "next/link";

const DRAFT_KEY = "robotics_recruitment_draft";
const TOTAL_STEPS = 9;

export default function JoinForm() {
  const router = useRouter();

  // Flow Mode selection (null: Selection Screen, 'requisition': Hardware Requisition, 'recruitment': Core Team recruitment)
  const [flowMode, setFlowMode] = useState(null);

  // Hardware Requisition Form States
  const [reqFormData, setReqFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);

  // OTP Verification States
  const [showOtpVerify, setShowOtpVerify] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [signupPendingPayload, setSignupPendingPayload] = useState(null);

  // Form Field States (Core Team Recruitment)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    year: "",
    branch: "",
    section: "",
    interests: "",
    reason: "",
    photoURL: "",
  });

  // Password Visibility Toggle States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showReqPassword, setShowReqPassword] = useState(false);
  const [showReqConfirmPassword, setShowReqConfirmPassword] = useState(false);

  // UI Flow States
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [submittingMsg, setSubmittingMsg] = useState("");

  const inputRef = useRef(null);

  // 1. Load Draft from LocalStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error loading form draft:", e);
      }
    }
  }, []);

  // 2. Autosave Draft on state change
  useEffect(() => {
    // Exclude password from localStorage draft autosave for security
    const { password, photoURL, ...safeData } = formData;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safeData));
  }, [formData]);

  // 3. Auto-focus inputs on slide change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorMsg("");
  }, [currentStep]);

  // 4. Keyboard Navigation Handler (Enter Key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (flowMode !== 'recruitment') return;
      if (e.key === "Enter") {
        e.preventDefault();
        // If textarea is focused, let Enter insert newline unless Ctrl/Cmd is held
        if (document.activeElement?.tagName === "TEXTAREA" && !e.ctrlKey) {
          return;
        }
        
        if (currentStep === TOTAL_STEPS) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, formData, selectedPhoto, flowMode]);

  // 5. Image Compression Utility (Handles high-res photos > 5MB, PNGs, and HEIC files)
  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrl;

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        // Draw white background so transparent PNGs don't turn black on JPEG conversion
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Always force image/jpeg at 0.75 quality to guarantee compression down to ~30-80KB
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              resolve(new File([blob], cleanName, { type: "image/jpeg" }));
            } else {
              // Fallback for browsers where toBlob canvas output fails
              try {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
                const arr = dataUrl.split(",");
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                  u8arr[n] = bstr.charCodeAt(n);
                }
                const fallbackBlob = new Blob([u8arr], { type: "image/jpeg" });
                const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                resolve(new File([fallbackBlob], cleanName, { type: "image/jpeg" }));
              } catch (e) {
                reject(new Error("Image processing failed"));
              }
            }
          },
          "image/jpeg",
          0.75
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to read image file. Please select a valid JPEG or PNG file."));
      };
    });
  };

  // File Selector Callback
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !/\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name)) {
      setErrorMsg("Please upload an image file only.");
      return;
    }

    try {
      setErrorMsg("");
      setIsUploading(true);
      
      // Dynamic Client-side Compression (handles > 5MB files)
      const compressed = await compressImage(file);
      setSelectedPhoto(compressed);
      
      // Preview rendering
      const previewUrl = URL.createObjectURL(compressed);
      setPhotoPreview(previewUrl);
    } catch (err) {
      console.error("Compression error:", err);
      setErrorMsg(err.message || "Failed to process image. Try selecting a smaller JPG or PNG image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Checks for registered duplicate emails
  const checkDuplicateEmail = async (emailToCheck) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('uid')
        .eq('email', emailToCheck.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return !!data;
    } catch (e) {
      console.error("Duplicate check error:", e);
      return false;
    }
  };

  async function handleNext() {
    setErrorMsg("");

    // Identify field for validation
    let validationField = "";
    let validationValue = "";

    switch (currentStep) {
      case 1:
        validationField = "name";
        validationValue = formData.name;
        break;
      case 2:
        validationField = "email";
        validationValue = formData.email;
        break;
      case 3:
        validationField = "password";
        validationValue = formData.password;
        if (formData.password !== formData.confirmPassword) {
          setErrorMsg("Passwords do not match. Please re-enter your password.");
          return;
        }
        break;
      case 4:
        validationField = "year";
        validationValue = formData.year;
        break;
      case 5:
        validationField = "branch";
        validationValue = formData.branch;
        break;
      case 6:
        validationField = "section";
        validationValue = formData.section;
        break;
      case 7:
        validationField = "interests";
        validationValue = formData.interests;
        break;
      case 8:
        validationField = "reason";
        validationValue = formData.reason;
        break;
      default:
        break;
    }

    // Run Schema Validations
    const error = validateRecruitmentField(validationField, validationValue);
    if (error) {
      setErrorMsg(error);
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  const handlePrev = () => {
    setErrorMsg("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRadioSelect = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }, 350);
  };

  async function handleSubmit() {
    setErrorMsg("");

    // Validate photo attachment step
    if (!selectedPhoto) {
      setErrorMsg("Please upload a profile photograph to complete registration.");
      return;
    }

    setSubmittingMsg("Creating member account credentials...");
    let uploadedPhotoUrl = "";

    try {
      // Check if email already exists in users profile database to prevent silent Supabase Auth block
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('uid')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error("This email is already registered. Please log in directly.");
      }

      // 1. Create Auth Credentials
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      const user = signUpData?.user;
      if (!user) throw new Error("Could not retrieve user registration metadata");

      // 2. Upload photograph to Supabase Storage (applicants bucket) if user & selectedPhoto exist
      if (user && selectedPhoto) {
        setSubmittingMsg("Uploading profile photo...");
        try {
          const fileExt = (selectedPhoto && selectedPhoto.name) ? selectedPhoto.name.split('.').pop() : 'jpg';
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('applicants')
            .upload(fileName, selectedPhoto, { upsert: true });

          if (uploadError) {
            console.error("Photo upload warning:", uploadError);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('applicants')
              .getPublicUrl(fileName);
            uploadedPhotoUrl = publicUrlData.publicUrl;
          }
        } catch (photoErr) {
          console.error("Photo processing warning:", photoErr);
        }
      }

      setSubmittingMsg("Registering profile details...");

      // 3. Directly insert user profile details into 'users' table
      const finalPayload = {
        uid: user.id,
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        phone: "",
        branch: formData.branch,
        year: formData.year,
        section: formData.section.trim(),
        interests: formData.interests,
        reason: formData.reason.trim(),
        photoURL: uploadedPhotoUrl,
        role: "member",
        status: "pending",
        memberId: "PENDING",
        createdAt: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([finalPayload]);

      if (dbError && !dbError.message?.toLowerCase().includes("duplicate")) {
        throw dbError;
      }

      // Clear draft & set completed
      localStorage.removeItem(DRAFT_KEY);
      setIsCompleted(true);
    } catch (err) {
      const errMsg = err?.message || err?.error_description || (typeof err === "string" ? err : JSON.stringify(err)) || "Registration failed.";
      console.error("Submission failed:", errMsg, err);
      const msg = errMsg.toLowerCase();

      if (msg.includes("already registered") || msg.includes("already in use")) {
        setErrorMsg("This email is already registered. Please use a different email or log in.");
      } else if (msg.includes("weak-password")) {
        setErrorMsg("Password is too weak. Please use at least 6 characters.");
      } else {
        setErrorMsg(errMsg);
      }
    } finally {
      setSubmittingMsg("");
    }
  };

  const validateCollegeEmail = (emailStr) => {
    const trimmed = emailStr.trim().toLowerCase();
    // Validate format: av.[department].[year/seq/branch]@*.amrita.edu
    // Examples: av.sc.u4aie23002@av.students.amrita.edu
    const regex = /^av\.[a-z]{2}\.u4[a-z]{3,4}\d{5}@(?:[a-z0-9.]*\.)?amrita\.edu$/i;
    return regex.test(trimmed);
  };

  const handleReqSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!reqFormData.name.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }

    if (!validateCollegeEmail(reqFormData.email)) {
      setErrorMsg(
        "Invalid college email format. Must follow standard college pattern, e.g. av.sc.u4aie23002@av.students.amrita.edu"
      );
      return;
    }

    if (reqFormData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (reqFormData.password !== reqFormData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setReqSubmitting(true);
    try {
      // Check if email already exists in users profile database to prevent silent Supabase Auth block
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('uid')
        .eq('email', reqFormData.email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error("This email is already registered. Please log in directly.");
      }

      // 1. Create Auth Credentials
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: reqFormData.email.trim(),
        password: reqFormData.password,
      });

      if (signUpError) throw signUpError;
      const user = signUpData?.user;
      if (!user) throw new Error("Could not retrieve user registration metadata");

      // Extract branch and year from email local part
      const localPart = reqFormData.email.split('@')[0];
      const parts = localPart.split('.');
      const rollPart = parts[2] || ""; // e.g. u4aie23002
      let branchName = "GEN";
      let joiningYear = "2023";

      if (rollPart.startsWith("u4")) {
        branchName = rollPart.substring(2, 5).toUpperCase(); // e.g. AIE
        joiningYear = "20" + rollPart.substring(5, 7); // e.g. 23 -> 2023
      }

      // Save payload to database directly
      const finalPayload = {
        uid: user.id,
        email: reqFormData.email.trim().toLowerCase(),
        name: reqFormData.name.trim(),
        phone: "",
        branch: branchName,
        year: joiningYear,
        section: "A",
        interests: "Hardware Requisition Access",
        reason: "Accessing the lab hardware stocks.",
        role: "member",
        status: "accepted", // Auto-accepted for student requisitions!
        memberId: "STUDENT",
        createdAt: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([finalPayload]);

      if (dbError && !dbError.message?.toLowerCase().includes("duplicate")) {
        throw dbError;
      }

      setReqSuccess(true);
    } catch (err) {
      console.error("Hardware Requisition signup failed:", err);
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("already registered") || msg.includes("already in use")) {
        setErrorMsg("This email is already registered. Please log in directly.");
      } else {
        setErrorMsg(err.message || "Sign up failed. Please check network settings.");
      }
    } finally {
      setReqSubmitting(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setOtpVerifying(true);

    try {
      if (otpToken.trim().length !== 8) {
        throw new Error("Please enter a valid 8-digit verification code.");
      }

      // 1. Verify OTP with Supabase
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: otpToken.trim(),
        type: 'signup'
      });

      if (verifyError) throw verifyError;

      const verifiedUser = verifyData?.user || verifyData?.session?.user;

      // 2. Insert user profile details
      if (signupPendingPayload) {
        const finalPayload = {
          ...signupPendingPayload,
          uid: signupPendingPayload.uid || (verifiedUser ? verifiedUser.id : "")
        };

        if (finalPayload.uid) {
          const { error: dbError } = await supabase
            .from('users')
            .insert([finalPayload]);

          if (dbError && !dbError.message?.toLowerCase().includes("duplicate")) {
            console.error("Profile insertion warning:", dbError);
          }
        }
      }

      // 3. Clear auth session to log out
      await supabase.auth.signOut();

      // 4. Trigger correct success screen depending on signup flow path
      if (flowMode === 'recruitment') {
        localStorage.removeItem(DRAFT_KEY);
        setIsCompleted(true);
      } else {
        setReqSuccess(true);
      }

      setShowOtpVerify(false);
      setOtpToken("");
    } catch (err) {
      console.error("Verification failed:", err);
      setErrorMsg(err.message || "Invalid or expired verification code.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg("");
    setSubmittingMsg("Resending verification code...");
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
      });
      if (error) throw error;
      alert("A new verification code has been sent to your email!");
    } catch (err) {
      console.error("Resending OTP failed:", err);
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("rate limit") || msg.includes("rate_limit") || msg.includes("once every") || err.status === 429) {
        setErrorMsg("Rate limit reached. Please check your inbox for the code already sent, or wait 60 seconds.");
      } else {
        setErrorMsg(err.message || "Failed to resend code. Please try again.");
      }
    } finally {
      setSubmittingMsg("");
    }
  };

  const selectionScreenJSX = (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden font-inter">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-600/5 filter blur-[100px] pointer-events-none" />

      <div className="max-w-4xl w-full relative z-10 text-center space-y-12">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/5 border border-cyan-500/20 px-3.5 py-1 rounded-full">
            AMRITA ROBOTICS CLUB
          </span>
          <h1 className="text-4xl md:text-5xl font-black font-orbitron mt-6 tracking-wider text-white">
            JOIN OUR ECOSYSTEM
          </h1>
          <p className="text-sm text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            Select the path that matches your requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            onClick={() => { setErrorMsg(""); setFlowMode("requisition"); }}
            className="glass-card p-8 rounded-3xl border border-white/[0.05] hover:border-cyan-500/30 transition-all text-left flex flex-col justify-between hover:scale-[1.02] cursor-pointer group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold font-orbitron text-white tracking-wide">
                Hardware Requisition
              </h2>
              <p className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-widest">
                Student Account
              </p>
              <ul className="text-sm text-gray-400 mt-6 space-y-3 font-inter">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Borrow microcontrollers, sensors, & parts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Real-time borrowed history log
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Requires college email verification
                </li>
              </ul>
            </div>
            <button className="w-full mt-8 py-3 bg-cyan-950/40 hover:bg-cyan-600 text-cyan-400 hover:text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-all border border-cyan-500/20">
              CREATE ACCOUNT →
            </button>
          </div>

          <div 
            onClick={() => { setErrorMsg(""); setFlowMode("recruitment"); }}
            className="glass-card p-8 rounded-3xl border border-white/[0.05] hover:border-purple-500/30 transition-all text-left flex flex-col justify-between hover:scale-[1.02] cursor-pointer group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold font-orbitron text-white tracking-wide">
                Join the Core Team
              </h2>
              <p className="text-xs text-purple-400 mt-2 font-mono uppercase tracking-widest">
                Official Recruitment
              </p>
              <ul className="text-sm text-gray-400 mt-6 space-y-3 font-inter">
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Build state-of-the-art club projects
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> National & international competitions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Structured multi-step application
                </li>
              </ul>
            </div>
            <button className="w-full mt-8 py-3 bg-purple-950/40 hover:bg-purple-600 text-purple-400 hover:text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-all border border-purple-500/20">
              START APPLICATION →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const otpVerifyJSX = (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden font-inter">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-600/5 filter blur-[100px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 glass-card border border-white/[0.05] p-8 rounded-3xl space-y-6 shadow-2xl">
        <div className="text-center">
          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/5 border border-cyan-500/20 px-3 py-1 rounded-full">
            EMAIL VERIFICATION
          </span>
          <h2 className="text-2xl font-bold font-orbitron text-white mt-4 uppercase tracking-wider">
            Enter OTP Code
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            We sent an 8-digit code to <strong className="text-gray-300 font-mono">{targetEmail}</strong>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center">
            {errorMsg}
          </div>
        )}

        {submittingMsg && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-xs font-mono text-center">
            {submittingMsg}
          </div>
        )}

        <form onSubmit={handleOtpVerify} className="space-y-6">
          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 text-center">
              8-Digit Code
            </label>
            <input
              type="text"
              maxLength={8}
              required
              placeholder="00000000"
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono text-center tracking-[0.6em] pl-[0.8em] text-white focus:outline-none focus:border-cyan-500 placeholder:opacity-20"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setErrorMsg(""); setShowOtpVerify(false); }}
              className="flex-1 py-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-gray-300 font-orbitron text-xs rounded-xl transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={otpVerifying}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
            >
              {otpVerifying ? "VERIFYING..." : "VERIFY CODE"}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleResendOtp}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline transition-colors"
          >
            Didn&apos;t receive code? Resend OTP
          </button>
        </div>
      </div>
    </div>
  );

  if (showOtpVerify) {
    return otpVerifyJSX;
  }

  const reqSuccessScreenJSX = (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden font-inter">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-600/5 filter blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-md w-full mx-auto glass-card border border-white/[0.05] rounded-3xl">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/20 px-3 py-1 rounded-full mb-4">
          REGISTRATION COMPLETE
        </span>
        <h2 className="text-2xl font-bold font-orbitron text-white tracking-wide mb-3 animate-pulse">
          ACCOUNT ACTIVE
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-xs font-inter">
          Your hardware requisition student account is fully active. You can now proceed to log in to request resources.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full max-w-xs py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          PROCEED TO LOGIN
        </button>
      </div>
    </div>
  );

  const requisitionFormJSX = (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden font-inter">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-600/5 filter blur-[100px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 glass-card border border-white/[0.05] p-8 rounded-3xl space-y-6 shadow-2xl">
        <div className="text-center">
          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/5 border border-cyan-500/20 px-3 py-1 rounded-full">
            REQUISITION REGISTRATION
          </span>
          <h2 className="text-2xl font-bold font-orbitron text-white mt-4 uppercase tracking-wider">
            Create Account
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Specify credentials to access student requisition portal.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleReqSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="Your Full Name"
              value={reqFormData.name}
              onChange={(e) => setReqFormData({ ...reqFormData, name: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-inter"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
              College Email
            </label>
            <input
              type="email"
              required
              placeholder="e.g. av.sc.u4aie23002@av.students.amrita.edu"
              value={reqFormData.email}
              onChange={(e) => setReqFormData({ ...reqFormData, email: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showReqPassword ? "text" : "password"}
                required
                placeholder="Min 6 characters"
                value={reqFormData.password}
                onChange={(e) => setReqFormData({ ...reqFormData, password: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowReqPassword(!showReqPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white transition-colors focus:outline-none"
                title={showReqPassword ? "Hide password" : "Show password"}
              >
                {showReqPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 012.122-.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21fM3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showReqConfirmPassword ? "text" : "password"}
                required
                placeholder="Re-enter password"
                value={reqFormData.confirmPassword}
                onChange={(e) => setReqFormData({ ...reqFormData, confirmPassword: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowReqConfirmPassword(!showReqConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white transition-colors focus:outline-none"
                title={showReqConfirmPassword ? "Hide password" : "Show password"}
              >
                {showReqConfirmPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 012.122-.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21fM3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => { setErrorMsg(""); setFlowMode(null); }}
              className="flex-1 py-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-gray-300 font-orbitron text-xs rounded-xl transition-all"
            >
              ← BACK
            </button>
            <button
              type="submit"
              disabled={reqSubmitting}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-xl tracking-wider transition-colors shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
            >
              {reqSubmitting ? "CREATING..." : "REGISTER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (reqSuccess) {
    return reqSuccessScreenJSX;
  }

  if (flowMode === null) {
    return selectionScreenJSX;
  }

  if (flowMode === 'requisition') {
    return requisitionFormJSX;
  }

  if (isCompleted) {
    return <SuccessScreen />;
  }

  // Shared input class
  const inputCls = `w-full py-4 px-0 text-xl outline-none font-inter transition-all duration-300 placeholder:opacity-40`;
  const inputStyle = {
    background: "transparent",
    borderBottom: "2px solid var(--border-card)",
    color: "var(--text-primary)",
  };

  // Option card shared class
  const optionCard = (selected) => ({
    padding: "16px 20px",
    borderRadius: "var(--radius-md)",
    border: selected
      ? "1.5px solid var(--accent-purple)"
      : "1.5px solid var(--border-card)",
    background: selected
      ? "rgba(124, 58, 237, 0.10)"
      : "var(--bg-card)",
    color: selected ? "var(--accent-purple)" : "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
    fontFamily: "var(--font-inter, Inter, sans-serif)",
    fontWeight: 600,
    fontSize: "0.95rem",
    boxShadow: selected ? "0 0 20px rgba(124,58,237,0.15)" : "none",
  });

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* ── Ambient glow orbs (fixed) ── */}
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "var(--accent-purple-glow)", filter: "blur(120px)", opacity: 0.6 }}
      />
      <div
        className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "var(--accent-teal-glow)", filter: "blur(100px)", opacity: 0.5 }}
      />

      <div className="w-full flex flex-col md:flex-row min-h-screen relative z-10">

        {/* ══════════════════════════════
            LEFT PANEL — Branding
        ══════════════════════════════ */}
        <div
          className="w-full md:w-5/12 flex flex-col justify-between p-10 md:p-14 relative overflow-hidden min-h-[260px] md:min-h-screen"
          style={{
            background: "rgba(255,255,255,0.015)",
            borderRight: "1px solid var(--border-subtle)",
          }}
        >
          {/* Grid texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(var(--border-card) 1px, transparent 1px), linear-gradient(90deg, var(--border-card) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Logo */}
          <div className="relative z-10">
            <Link
              href="/"
              className="font-black font-orbitron text-lg tracking-wider hover:opacity-80 transition-opacity"
              style={{ color: "var(--accent-teal)" }}
            >
              ROBOTICS<span style={{ color: "var(--text-primary)", fontWeight: 300 }}>.CLUB</span>
            </Link>
          </div>

          {/* Hero text */}
          <div className="relative z-10 my-auto py-10">
            {/* Chip */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-mono"
              style={{
                background: "var(--accent-purple-glow)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "var(--accent-purple)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--accent-purple)" }}
              />
              FALL 2026 · OPEN RECRUITMENT
            </div>

            <h1
              className="font-black font-orbitron leading-[1.08] mb-6"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", color: "var(--text-primary)" }}
            >
              JOIN THE{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CORE
              </span>
              <br />
              ROBOTICS
              <br />
              TEAM
            </h1>

            <p
              className="font-inter text-sm leading-relaxed max-w-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Build real robots, compete globally, and solve engineering
              challenges that matter. Applications reviewed on a rolling basis.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-10">
              {[
                { val: "50+", label: "Active Members" },
                { val: "12+", label: "Projects Live" },
                { val: "3×", label: "Championship" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div
                    className="font-orbitron font-black text-2xl"
                    style={{ color: "var(--accent-teal)" }}
                  >
                    {val}
                  </div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-widest mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="relative z-10 font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            ARC // SYSTEM VER 3.0.0
          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT PANEL — Form Wizard
        ══════════════════════════════ */}
        <div className="w-full md:w-7/12 flex flex-col">
          <FormProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-14 max-w-2xl w-full mx-auto">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-10">

              {/* Step label */}
              <div
                className="font-mono text-xs uppercase tracking-widest"
                style={{ color: "var(--accent-teal)" }}
              >
                {currentStep} /{" "}
                <span style={{ color: "var(--text-muted)" }}>{TOTAL_STEPS}</span>
              </div>

              {/* ── Step 1: Name ── */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    What is your{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      full name
                    </span>
                    ?
                  </h2>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputCls}
                    style={{
                      ...inputStyle,
                      borderBottomColor: formData.name ? "var(--accent-teal)" : undefined,
                    }}
                  />
                  <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    e.g. Shashwat Mishra
                  </p>
                </div>
              )}

              {/* ── Step 2: Email ── */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    Your college{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      email
                    </span>{" "}
                    address?
                  </h2>
                  <input
                    ref={inputRef}
                    type="email"
                    placeholder="name@student.amrita.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputCls}
                    style={{
                      ...inputStyle,
                      borderBottomColor: formData.email ? "var(--accent-teal)" : undefined,
                    }}
                  />
                  <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    Used for application status correspondence.
                  </p>
                </div>
              )}

              {/* ── Step 3: Password ── */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2
                      className="font-black font-orbitron leading-tight mb-2"
                      style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                    >
                      Create a secure{" "}
                      <span
                        style={{
                          background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        password
                      </span>
                    </h2>
                    <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      Minimum 6 characters. Store securely.
                    </p>
                  </div>

                  {/* Create Password Field */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400">
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`${inputCls} pr-12`}
                        style={{
                          ...inputStyle,
                          borderBottomColor: formData.password ? "var(--accent-teal)" : undefined,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 012.122-.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21fM3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Re-enter Password Field */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400">
                      Re-enter Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword || ""}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`${inputCls} pr-12`}
                        style={{
                          ...inputStyle,
                          borderBottomColor: formData.confirmPassword
                            ? formData.password === formData.confirmPassword
                              ? "var(--accent-teal)"
                              : "#ef4444"
                            : undefined,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 012.122-.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21fM3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="font-mono text-xs text-red-400 mt-1">Passwords do not match.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 4: Year ── */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    Academic{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      year
                    </span>
                    ?
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleRadioSelect("year", year)}
                        style={optionCard(formData.year === year)}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 5: Branch ── */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    Your{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      branch
                    </span>{" "}
                    of study?
                  </h2>
                  <select
                    ref={inputRef}
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full py-4 text-lg outline-none transition-all font-inter"
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: "2px solid var(--border-card)",
                      color: formData.branch ? "var(--text-primary)" : "var(--text-muted)",
                      borderBottomColor: formData.branch ? "var(--accent-teal)" : undefined,
                    }}
                  >
                    <option value="" disabled style={{ background: "#111" }}>
                      Choose your branch...
                    </option>
                    <option value="AIE" style={{ background: "#111" }}>Artificial Intelligence Engineering (AIE)</option>
                    <option value="CSE" style={{ background: "#111" }}>Computer Science (CSE)</option>
                    <option value="CCE" style={{ background: "#111" }}>Computer & Communication (CCE)</option>
                    <option value="AIDS" style={{ background: "#111" }}>AI and Data Science (AIDS)</option>
                  </select>
                </div>
              )}

              {/* ── Step 6: Section ── */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    Class{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      section
                    </span>
                    ?
                  </h2>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="e.g. A, B, C..."
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className={inputCls}
                    style={{
                      ...inputStyle,
                      borderBottomColor: formData.section ? "var(--accent-teal)" : undefined,
                    }}
                  />
                </div>
              )}

              {/* ── Step 7: Interests ── */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    Area of{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      interest
                    </span>
                    ?
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Software / AI", icon: "⚡" },
                      { label: "Hardware / IoT", icon: "🔧" },
                      { label: "Mechanical / Design", icon: "⚙️" },
                      { label: "Management", icon: "📋" },
                    ].map(({ label, icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleRadioSelect("interests", label)}
                        style={optionCard(formData.interests === label)}
                      >
                        <span className="mr-2">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 8: Reason ── */}
              {currentStep === 8 && (
                <div className="space-y-5">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    Why do you want to{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      join us
                    </span>
                    ?
                  </h2>
                  <textarea
                    ref={inputRef}
                    rows={4}
                    placeholder="Tell us what drives you..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full py-4 text-lg outline-none font-inter resize-none transition-all"
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: "2px solid var(--border-card)",
                      color: "var(--text-primary)",
                      borderBottomColor: formData.reason ? "var(--accent-teal)" : undefined,
                    }}
                  />
                  <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    Minimum 10 characters.
                  </p>
                </div>
              )}

              {/* ── Step 9: Photo ── */}
              {currentStep === 9 && (
                <div className="space-y-6">
                  <h2
                    className="font-black font-orbitron leading-tight"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-primary)" }}
                  >
                    Upload your{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      photo
                    </span>
                  </h2>

                  <div
                    className="flex flex-col sm:flex-row items-center gap-8 p-8 rounded-2xl"
                    style={{
                      background: "var(--bg-card)",
                      border: "1.5px solid var(--border-card)",
                    }}
                  >
                    {/* Avatar preview */}
                    <div
                      className="relative w-28 h-28 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                      style={{
                        background: "rgba(124, 58, 237, 0.08)",
                        border: "2px solid var(--border-card)",
                        boxShadow: photoPreview ? "0 0 24px rgba(124,58,237,0.2)" : "none",
                      }}
                    >
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          fill="none"
                          stroke="var(--text-muted)"
                          viewBox="0 0 24 24"
                          className="w-10 h-10"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs cursor-pointer transition-all hover:scale-[1.02]"
                        style={{
                          background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                          color: "#fff",
                          boxShadow: "0 0 20px rgba(124,58,237,0.25)",
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {photoPreview ? "CHANGE PHOTO" : "SELECT IMAGE"}
                      </label>
                      <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        PNG, JPG · Max 5MB · Auto-compressed
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Error message ── */}
              {errorMsg && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl font-mono text-xs"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#f87171",
                  }}
                >
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* ── Submitting progress ── */}
              {submittingMsg && (
                <div
                  className="flex items-center gap-3 text-xs font-mono"
                  style={{ color: "var(--accent-teal)" }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-ping shrink-0"
                    style={{ background: "var(--accent-teal)" }}
                  />
                  {submittingMsg}
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="flex items-center gap-4 pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={!!submittingMsg || isUploading}
                    className="px-6 py-3 rounded-xl font-orbitron font-bold text-xs transition-all hover:opacity-80 disabled:opacity-40"
                    style={{
                      background: "var(--bg-card)",
                      border: "1.5px solid var(--border-card)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    ← BACK
                  </button>
                )}

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!!submittingMsg}
                    className="px-7 py-3 rounded-xl font-orbitron font-bold text-xs transition-all hover:scale-[1.02] hover:opacity-90 disabled:opacity-40"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(124,58,237,0.3)",
                    }}
                  >
                    OK ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!!submittingMsg || isUploading}
                    className="px-8 py-3.5 rounded-xl font-orbitron font-bold text-xs transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-purple), var(--accent-teal))",
                      color: "#fff",
                      boxShadow: "0 0 30px rgba(124,58,237,0.4)",
                    }}
                  >
                    SUBMIT APPLICATION →
                  </button>
                )}

                {currentStep < TOTAL_STEPS && (
                  <span className="hidden sm:inline font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    press <strong style={{ color: "var(--text-secondary)" }}>Enter ↵</strong>
                  </span>
                )}
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}