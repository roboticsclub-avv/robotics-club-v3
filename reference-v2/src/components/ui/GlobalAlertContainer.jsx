"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { subscribeAlert } from "@/lib/alert-store";

export default function GlobalAlertContainer() {
  const [config, setConfig] = useState({
    isOpen: false,
    type: "alert", // "alert" or "confirm"
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    onClose: null,
  });

  useEffect(() => {
    return subscribeAlert((newConfig) => {
      setConfig({
        isOpen: true,
        type: newConfig.type,
        title: newConfig.title,
        message: newConfig.message,
        onConfirm: () => {
          setConfig(prev => ({ ...prev, isOpen: false }));
          if (newConfig.onConfirm) newConfig.onConfirm();
        },
        onCancel: () => {
          setConfig(prev => ({ ...prev, isOpen: false }));
          if (newConfig.onCancel) newConfig.onCancel();
        },
        onClose: () => {
          setConfig(prev => ({ ...prev, isOpen: false }));
          if (newConfig.onClose) newConfig.onClose();
        },
      });
    });
  }, []);

  const handleBackdropClick = () => {
    if (config.type === "alert") {
      config.onClose();
    } else {
      config.onCancel();
    }
  };

  return (
    <AnimatePresence>
      {config.isOpen && (
        <div style={styles.overlay}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            style={styles.backdrop}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, y: 15, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { type: "spring", stiffness: 380, damping: 26 }
            }}
            exit={{ scale: 0.92, y: 15, opacity: 0, transition: { duration: 0.15 } }}
            style={styles.modal}
          >
            {/* Top accent line */}
            <div style={{
              ...styles.topGradient,
              background: config.type === "confirm" 
                ? "linear-gradient(90deg, #7c3aed 0%, var(--accent-orange) 100%)" 
                : "linear-gradient(90deg, var(--accent-orange) 0%, #ff8255 100%)"
            }} />

            {/* Inner Content */}
            <div style={styles.content}>
              {/* Icon Container */}
              <div style={{
                ...styles.iconContainer,
                background: config.type === "confirm" ? "rgba(124, 58, 237, 0.1)" : "rgba(255, 107, 53, 0.1)",
                borderColor: config.type === "confirm" ? "rgba(124, 58, 237, 0.2)" : "rgba(255, 107, 53, 0.2)"
              }}>
                {config.type === "confirm" ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h3 style={styles.title}>{config.title || (config.type === "confirm" ? "Confirm Action" : "Notice")}</h3>

              {/* Message */}
              <p style={styles.message}>{config.message}</p>

              {/* Action Buttons */}
              <div style={styles.buttonGroup}>
                {config.type === "confirm" ? (
                  <>
                    <button 
                      onClick={config.onCancel} 
                      style={styles.secondaryBtn}
                      onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                      onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={config.onConfirm} 
                      style={{
                        ...styles.primaryBtn,
                        background: "var(--accent-orange)"
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = "0.9"}
                      onMouseOut={e => e.currentTarget.style.opacity = "1"}
                    >
                      Confirm
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={config.onClose} 
                    style={{
                      ...styles.primaryBtn,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#ffffff"
                    }}
                    onMouseOver={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"}
                    onMouseOut={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "20px",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(5, 5, 5, 0.75)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "380px",
    background: "rgba(18, 18, 18, 0.9)",
    backdropFilter: "blur(25px)",
    WebkitBackdropFilter: "blur(25px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.6)",
    fontFamily: "var(--font-inter), sans-serif",
  },
  topGradient: {
    height: "4px",
  },
  content: {
    padding: "28px 24px 22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconContainer: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    border: "1px solid",
  },
  title: {
    fontSize: "1.15rem",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "8px",
    letterSpacing: "-0.01em",
  },
  message: {
    fontSize: "0.88rem",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    marginBottom: "24px",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    width: "100%",
    justifyContent: "center",
  },
  primaryBtn: {
    flex: 1,
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  secondaryBtn: {
    flex: 1,
    padding: "10px 16px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
};
