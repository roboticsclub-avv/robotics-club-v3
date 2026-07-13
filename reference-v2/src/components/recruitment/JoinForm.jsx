"use client";

import React, { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";
import { storage } from "@/lib/firebase/storage";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { validateRecruitmentField } from "@/schemas/user.schema";
import FormProgress from "./FormProgress";
import SuccessScreen from "./SuccessScreen";
import Link from "next/link";

const DRAFT_KEY = "robotics_recruitment_draft";
const TOTAL_STEPS = 9;

export default function JoinForm() {
  // Form Field States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    year: "",
    branch: "",
    section: "",
    interests: "",
    reason: "",
    photoURL: "",
  });

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
  }, [currentStep, formData, selectedPhoto]);

  // 5. Image Compression Utility
  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
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
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: file.type }));
              } else {
                reject(new Error("Image compression canvas blob output empty"));
              }
            },
            file.type || "image/jpeg",
            0.7
          );
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // File Selector Callback
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file only.");
      return;
    }

    try {
      setErrorMsg("");
      setIsUploading(true);
      
      // Dynamic Client-side Compression
      const compressed = await compressImage(file);
      setSelectedPhoto(compressed);
      
      // Preview rendering
      const previewUrl = URL.createObjectURL(compressed);
      setPhotoPreview(previewUrl);
    } catch (err) {
      console.error("Compression error:", err);
      setErrorMsg("Failed to process image. Try another file.");
    } finally {
      setIsUploading(false);
    }
  };

  // Checks for registered duplicate emails
  const checkDuplicateEmail = async (emailToCheck) => {
    const q = query(
      collection(db, "users"),
      where("email", "==", emailToCheck.trim().toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
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

    // Step-specific server-side checking: Duplicate Email check is handled by Firebase Auth on submit
    // (Firebase Auth throws auth/email-already-in-use if email is already registered)
    // We skip the unauthenticated Firestore query here since the users collection
    // requires authentication to read.

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

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
      // 1. Create Auth Credentials FIRST so we have a valid user token
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;

      setSubmittingMsg("Uploading profile photo...");

      // 2. Upload photograph to Firebase Storage (now authenticated)
      const storageRef = ref(storage, `applicants/${user.uid}_${selectedPhoto.name}`);
      const uploadResult = await uploadBytes(storageRef, selectedPhoto);
      uploadedPhotoUrl = await getDownloadURL(uploadResult.ref);

      setSubmittingMsg("Saving profile details...");

      // 3. Write Firestore record users/{uid}
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
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
      });

      // 4. Force Sign out immediately to prevent auto-login
      await signOut(auth);

      // Clear draft storage
      localStorage.removeItem(DRAFT_KEY);
      
      setIsCompleted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      // Provide friendly error messages for common Firebase Auth errors
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please use a different email or log in.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("Password is too weak. Please use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("Invalid email address format.");
      } else {
        setErrorMsg(err.message || "Registration failed. Please check network settings.");
      }
    } finally {
      setSubmittingMsg("");
    }
  };

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
                <div className="space-y-5">
                  <h2
                    className="font-black font-orbitron leading-tight"
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
                  <input
                    ref={inputRef}
                    type="password"
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputCls}
                    style={{
                      ...inputStyle,
                      borderBottomColor: formData.password ? "var(--accent-teal)" : undefined,
                    }}
                  />
                  <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    Minimum 6 characters. Store securely.
                  </p>
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