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

    // Step-specific server-side checking: Duplicate Email check on Step 2
    if (currentStep === 2) {
      try {
        setSubmittingMsg("Checking email uniqueness...");
        const isDuplicate = await checkDuplicateEmail(formData.email);
        setSubmittingMsg("");
        if (isDuplicate) {
          setErrorMsg("This email is already registered with an application.");
          return;
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
        setSubmittingMsg("");
        setErrorMsg("Network error. Please try again.");
        return;
      }
    }

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

    setSubmittingMsg("Uploading profile photo...");
    let uploadedPhotoUrl = "";

    try {
      // 1. Upload photograph to Firebase Storage
      const storageRef = ref(storage, `applicants/${Date.now()}_${selectedPhoto.name}`);
      const uploadResult = await uploadBytes(storageRef, selectedPhoto);
      uploadedPhotoUrl = await getDownloadURL(uploadResult.ref);

      setSubmittingMsg("Creating member account credentials...");
      
      // 2. Create Auth Credentials
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;

      setSubmittingMsg("Saving profile details...");

      // 3. Write Firestore record users/{uid}
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        phone: "", // Matches V1 registration schema
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
      setErrorMsg(err.message || "Registration failed. Please check network settings.");
    } finally {
      setSubmittingMsg("");
    }
  };

  if (isCompleted) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen flex text-white bg-[#0a0a0a]">
      <div className="w-full flex flex-col md:flex-row min-h-screen">
        {/* Left Hand side: Static fall program panel */}
        <div className="w-full md:w-5/12 bg-slate-950 p-12 flex flex-col justify-between border-r border-white/5 relative overflow-hidden min-h-[300px] md:min-h-screen">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-transparent to-purple-950/10 pointer-events-none" />
          <div className="relative z-10">
            <Link href="/" className="text-xl font-black font-orbitron tracking-wider text-cyan-400">
              ROBOTICS<span className="text-white font-normal">.CLUB</span>
            </Link>
          </div>
          <div className="relative z-10 my-auto">
            <h2 className="text-5xl md:text-6xl font-black font-orbitron leading-tight text-white mb-4">
              FALL <br />
              <span className="text-cyan-400">2026</span> <br />
              PROGRAM
            </h2>
            <p className="text-gray-400 font-mono text-sm tracking-widest uppercase">&gt; CLUB MEMBER RECRUITMENT</p>
          </div>
          <div className="relative z-10 text-gray-600 text-xs font-mono">
            ARC // SYSTEM VER 3.0.0
          </div>
        </div>

        {/* Right Hand side: Wizard layout */}
        <div className="w-full md:w-7/12 flex flex-col bg-slate-900/20 min-h-screen">
          <FormProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-12 max-w-2xl w-full mx-auto">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              
              {/* Step 1: Full Name */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">1 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    What is your <span className="text-cyan-400">full name</span>? *
                  </h3>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 py-3 text-xl text-white outline-none transition-colors placeholder-slate-600"
                  />
                  <p className="text-slate-500 text-xs font-mono">Example: Shashwat Mishra</p>
                </div>
              )}

              {/* Step 2: Email */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">2 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    What is your <span className="text-cyan-400">college email</span> address? *
                  </h3>
                  <input
                    ref={inputRef}
                    type="email"
                    placeholder="name@student.amrita.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 py-3 text-xl text-white outline-none transition-colors placeholder-slate-600"
                  />
                  <p className="text-slate-500 text-xs font-mono">For application status correspondence.</p>
                </div>
              )}

              {/* Step 3: Password */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">3 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    Create an account <span className="text-cyan-400">password</span>. *
                  </h3>
                  <input
                    ref={inputRef}
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 py-3 text-xl text-white outline-none transition-colors placeholder-slate-600"
                  />
                  <p className="text-slate-500 text-xs font-mono">Minimum 6 characters. Store securely.</p>
                </div>
              )}

              {/* Step 4: Year Select */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">4 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    Which academic <span className="text-cyan-400">year</span> are you in? *
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleRadioSelect("year", year)}
                        className={`p-4 border rounded text-left font-semibold transition-all ${
                          formData.year === year
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                            : "bg-slate-900/40 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Branch */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">5 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    Select your <span className="text-cyan-400">branch</span> of study. *
                  </h3>
                  <select
                    ref={inputRef}
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-slate-900 border-b-2 border-slate-700 focus:border-cyan-400 py-3 text-xl text-white outline-none transition-colors"
                  >
                    <option value="" disabled>Choose branch...</option>
                    <option value="AIE">Artificial Intelligence (AIE)</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="CCE">Computer & Communication Engineering (CCE)</option>
                    <option value="AIDS">Artificial Intelligence and Data Science (AIDS)</option>
                  </select>
                </div>
              )}

              {/* Step 6: Section */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">6 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    What is your class <span className="text-cyan-400">section</span>? *
                  </h3>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="e.g. A, B, C..."
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 py-3 text-xl text-white outline-none transition-colors placeholder-slate-600"
                  />
                </div>
              )}

              {/* Step 7: Interest */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">7 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    Which area <span className="text-cyan-400">interests</span> you the most? *
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["Software/AI", "Hardware/IoT", "Mechanical/Design", "Management"].map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleRadioSelect("interests", interest)}
                        className={`p-4 border rounded text-left font-semibold transition-all ${
                          formData.interests === interest
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                            : "bg-slate-900/40 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 8: Reason */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">8 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    Why do you want to <span className="text-cyan-400">join us</span>? *
                  </h3>
                  <textarea
                    ref={inputRef}
                    rows="3"
                    placeholder="Tell us what drives you..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 py-2 text-lg text-white outline-none transition-colors placeholder-slate-600 resize-none"
                  />
                  <p className="text-slate-500 text-xs font-mono">Minimum 10 characters.</p>
                </div>
              )}

              {/* Step 9: Photograph Upload */}
              {currentStep === 9 && (
                <div className="space-y-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">9 ➜</span>
                  <h3 className="text-2xl font-bold font-orbitron text-white">
                    Upload your <span className="text-cyan-400">profile photograph</span> *
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-950/40 rounded border border-slate-800">
                    <div className="relative w-24 h-24 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8 text-slate-500">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono rounded cursor-pointer transition-colors"
                      >
                        SELECT IMAGE
                      </label>
                      <p className="text-slate-500 text-xs font-mono">PNG, JPG or JPEG. Compressed automatically.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {errorMsg && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono rounded">
                  {errorMsg}
                </div>
              )}

              {/* Status Submission Loaders */}
              {submittingMsg && (
                <div className="flex items-center gap-3 text-cyan-400 text-xs font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  {submittingMsg}
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex items-center gap-4 pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={!!submittingMsg || isUploading}
                    className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold font-orbitron rounded text-xs transition-colors"
                  >
                    BACK
                  </button>
                )}

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!!submittingMsg}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-orbitron rounded text-xs transition-colors"
                  >
                    OK ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!!submittingMsg || isUploading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 text-white font-bold font-orbitron rounded text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    SUBMIT APPLICATION
                  </button>
                )}

                {currentStep < TOTAL_STEPS && (
                  <span className="hidden sm:inline text-slate-600 text-xs font-mono">
                    press <strong>Enter ↵</strong>
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
