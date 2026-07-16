"use client";

import styles from "./Hero.module.css";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import TextAnimation from "./ui/scroll-text";

// Lazy load spline to improve performance on main thread
// When loading or when WebGL falls back, show the Static Robot Placeholder Image
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <RobotPlaceholder />,
});

function RobotPlaceholder() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.placeholderGlow} />
    </div>
  );
}

export default function Hero({ isReady }) {
  const [isRecruiting, setIsRecruiting] = useState(true);
  const [inView, setInView] = useState(true);
  const [deviceType, setDeviceType] = useState("desktop"); // "desktop" | "tablet" | "mobile"
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  useEffect(() => {
    if (inView) {
      setHasBeenViewed(true);
    }
  }, [inView]);

  // 1. Detect Viewport resizing & match device type
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMotionChange);
    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  // 3. Monitor intersection of visual block to save CPU/GPU cycles
  useEffect(() => {
    const visualElement = document.querySelector(`.${styles.heroVisual}`);
    if (!visualElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setInView(entry.isIntersecting);
        });
      },
      { threshold: 0.0 }
    );

    observer.observe(visualElement);
    return () => observer.disconnect();
  }, []);

  // 4. Firebase recruitment status sync
  useEffect(() => {
    const cached = sessionStorage.getItem("is_recruiting");
    if (cached !== null) {
      setIsRecruiting(cached === "true");
    }

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "is_recruiting");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsRecruiting(data.value);
          sessionStorage.setItem("is_recruiting", String(data.value));
        }
      } catch (err) {
        console.error("Error fetching recruitment setting:", err);
      }
    };
    fetchSettings();
  }, []);

  // 5. Glitch typewriter animation with reduced motion support
  useEffect(() => {
    const textElement = document.querySelector(".typewriter-text");
    if (!textElement) return;

    const phrases = ["CODE.\nCONSTRUCT.\nCONQUER.", "INNOVATE.\nBUILD.\nINSPIRE."];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let activeTimer = null;

    const glyphs = "█▓▒░_+$^&@#";

    function type() {
      if (!textElement) return;

      if (prefersReducedMotion) {
        textElement.innerHTML = phrases[0].replace(/\n/g, "<br/>");
        return;
      }

      const currentPhrase = phrases[phraseIndex];
      let textToShow = "";

      if (isDeleting) {
        textToShow = currentPhrase.substring(0, charIndex);
      } else {
        const subStr = currentPhrase.substring(0, charIndex);
        if (Math.random() > 0.82 && charIndex > 0) {
          textToShow = subStr
            .split("")
            .map((c) =>
              c === "\n" || Math.random() > 0.25
                ? c
                : glyphs[Math.floor(Math.random() * glyphs.length)]
            )
            .join("");
        } else {
          textToShow = subStr;
        }
      }

      const lines = textToShow.split("\n");
      const isTypingLastLine = lines.length === currentPhrase.split("\n").length;

      if (isTypingLastLine && lines[lines.length - 1].length > 0) {
        const precedingLines = lines.slice(0, lines.length - 1);
        const lastLine = lines[lines.length - 1];

        let html = precedingLines.join("<br/>");
        if (precedingLines.length > 0) html += "<br/>";
        html += `<span class="${styles.heroTitleAccent}">${lastLine}</span>`;
        textElement.innerHTML = html;
      } else {
        textElement.innerHTML = textToShow.replace(/\n/g, "<br/>");
      }

      let typeSpeed = isDeleting ? 40 : 80;

      if (!isDeleting && charIndex === currentPhrase.length) {
        typeSpeed = 2500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 600;
      }

      charIndex += isDeleting ? -1 : 1;
      activeTimer = setTimeout(type, typeSpeed);
    }

    if (prefersReducedMotion) {
      textElement.innerHTML = phrases[0].replace(/\n/g, "<br/>");
    } else {
      activeTimer = setTimeout(type, 800);
    }

    return () => {
      if (activeTimer) clearTimeout(activeTimer);
    };
  }, [prefersReducedMotion]);

  return (
    <section className={styles.hero} id="home">
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <div
              className={styles.badge}
              style={
                !isRecruiting
                  ? {
                      borderColor: "rgba(34, 197, 94, 0.3)",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      color: "#22c55e",
                      marginBottom: 0,
                    }
                  : { marginBottom: 0 }
              }
            >
              <span
                className={styles.badgeDot}
                style={
                  !isRecruiting
                    ? { backgroundColor: "#22c55e", boxShadow: "0 0 8px #22c55e" }
                    : {}
                }
              />
              {isRecruiting ? "Now Recruiting Members" : "Welcome Club Members"}
            </div>
          </div>

          <h1 className={styles.heroTitle}>
            <span className={`typewriter-text ${styles.typewriterText}`} />
          </h1>

          <p className={styles.heroDescription}>
            Join our community of makers, engineers, and dreamers who are shaping the future of automation.
          </p>

          <div className={styles.heroCta}>
            <a href="#contact" className={styles.ctaPrimary}>
              Join the Club <span>→</span>
            </a>
            <a href="#projects" className={styles.ctaSecondary}>
              View Projects
            </a>
          </div>

          <div className={styles.heroShortcut}>
            Press <span className={styles.key}>J</span> to join instantly
          </div>
        </div>

        <div className={styles.heroVisual}>
          {deviceType === "mobile" ? (
            // Mobile: Static high-fidelity placeholder image
            <div className={styles.robotImageWrapper}>
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/media/robotics-side.png`}
                alt="Robotics Club Robot"
                className={styles.staticRobotImage}
              />
            </div>
          ) : isReady && hasBeenViewed ? (
            // Desktop & Tablet: Spline 3D Scene
            <div
              className={styles.splineWrapper}
              style={{
                // Scaled down on tablet, pointer events disabled to stop tracking
                transform: deviceType === "tablet" ? "scale(0.85)" : "scale(1)",
                pointerEvents:
                  deviceType === "mobile" || deviceType === "tablet" ? "none" : "auto",
                transition: "transform 0.3s ease, opacity 0.5s ease",
                opacity: inView ? 1 : 0,
              }}
            >
              <Spline scene={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/scene.splinecode`} />
            </div>
          ) : (
            // Load state / WebGL off placeholder
            <RobotPlaceholder />
          )}
        </div>
      </div>

      {/* Discovery Scroll Cue */}
      <div className={styles.scrollCue}>
        <a href="#about" className={styles.scrollCueLink}>
          <span className={styles.scrollCueText}>Explore</span>
          <span
            className={styles.scrollCueArrow}
            style={{
              animation: prefersReducedMotion ? "none" : "bounceArrow 2s infinite",
            }}
          >
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
