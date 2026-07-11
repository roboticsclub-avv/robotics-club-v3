"use client";

import { useState, useEffect } from "react";
import styles from "./LoadingScreen.module.css";

export default function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      // Speed up loading instantly for reduced motion
      setProgress(100);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          if (onFinish) onFinish();
          setIsVisible(false);
        }, 100);
      }, 200);
      return () => clearTimeout(timer);
    }

    // Standard dynamic loading animation
    let start = 0;
    const interval = setInterval(() => {
      start += Math.floor(Math.random() * 8) + 4;
      if (start >= 100) {
        start = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            if (onFinish) onFinish();
          }, 500);
          setTimeout(() => {
            setIsVisible(false);
          }, 1200);
        }, 600);
      }
      setProgress(start);
    }, 80);

    return () => clearInterval(interval);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.loadingOverlay} ${isExiting ? styles.loadingOverlayHidden : ""}`}>
      <div className={`${styles.revealBox} ${isExiting ? styles.revealBoxFull : ""}`}>
        <div className={styles.brandingContainer}>
          <h1 className={styles.clubTitle}>ROBOTICS CLUB AVV</h1>
          <div className={styles.subTextContainer}>
            <p className={styles.loaderStatus}>Initializing Innovation...</p>
            <span className={styles.progressPercent}>{progress}%</span>
          </div>
          {/* Glowing Cyber Progress Bar */}
          <div className={styles.progressBarWrapper}>
            <div
              className={styles.progressBarFill}
              style={{
                width: `${progress}%`,
                transition: prefersReducedMotion ? "none" : "width 0.1s ease-out",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
