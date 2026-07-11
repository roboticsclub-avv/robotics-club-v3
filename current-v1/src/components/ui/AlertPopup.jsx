"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";

export default function AlertPopup({ isOpen, onClose, title, message, onAction, actionLabel }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={styles.overlay}>
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={styles.backdrop}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { type: "spring", stiffness: 300, damping: 25 }
            }}
            exit={{ scale: 0.9, y: 20, opacity: 0, transition: { duration: 0.15 } }}
            style={styles.modal}
          >
            {/* Gradient Top Border */}
            <div style={styles.topGradient} />

            {/* Content */}
            <div style={styles.content}>
              {/* Warning Icon */}
              <div style={styles.iconContainer}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              {/* Title */}
              <h3 style={styles.title}>{title || "Attention Required"}</h3>

              {/* Message */}
              <p style={styles.message}>{message}</p>

              {/* Buttons */}
              <div style={styles.buttonGroup}>
                <button 
                  onClick={onClose} 
                  className="alert-btn-secondary"
                  style={styles.secondaryBtn}
                >
                  Close
                </button>
                {onAction && (
                  <button 
                    onClick={onAction} 
                    className="alert-btn-primary"
                    style={styles.primaryBtn}
                  >
                    {actionLabel || "Proceed"}
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
    zIndex: 9999,
    padding: "20px",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(5, 5, 5, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
    background: "rgba(20, 20, 20, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
    fontFamily: "var(--font-inter), sans-serif",
  },
  topGradient: {
    height: "4px",
    background: "linear-gradient(90deg, var(--accent-orange) 0%, #7c3aed 100%)",
  },
  content: {
    padding: "32px 24px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconContainer: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "rgba(255, 107, 53, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    border: "1px solid rgba(255, 107, 53, 0.2)",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "12px",
    letterSpacing: "-0.01em",
  },
  message: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    marginBottom: "24px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    width: "100%",
    justifyContent: "center",
  },
  primaryBtn: {
    flex: 1,
    padding: "10px 16px",
    background: "var(--accent-orange)",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  secondaryBtn: {
    flex: 1,
    padding: "10px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
