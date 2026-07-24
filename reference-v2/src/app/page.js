"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FacultyMembers from "@/components/FacultyMembers";
import StudentMentors from "@/components/StudentMentors";
import StudentMembers from "@/components/StudentMembers";
import Events from "@/components/Events";
import Projects from "@/components/Projects";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import Lenis from "lenis";

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    },
  },
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    // Initialize Lenis — tuned for snappy high-FPS buttery feel
    const lenis = new Lenis({
      lerp: 0.12,            // Higher = more responsive, lower = more floaty/laggy
      smoothWheel: true,
      wheelMultiplier: 1.2,  // Slightly higher for immediate wheel response
      touchMultiplier: 2.0,  // Snappier on touch/trackpad
      infinite: false,
    });
    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    /* ===== Keyboard shortcut: J to scroll to contact ===== */
    const handleKeyDown = (e) => {
      if (
        e.key === "j" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        const contactSection = document.getElementById("contact");
        if (contactSection) lenis.scrollTo(contactSection);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.lenis;
    };
  }, [isLoading]);

  const handleLoadingFinish = () => {
    try {
      sessionStorage.setItem('intro_seen', 'true');
    } catch (e) {
      console.warn("Session storage disabled:", e);
    }
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <LoadingScreen onFinish={handleLoadingFinish} />}
      <div style={{
        opacity: isLoading ? 0 : 1,
        visibility: isLoading ? 'hidden' : 'visible',
        transition: 'opacity 0.8s ease-out',
        pointerEvents: isLoading ? 'none' : 'auto'
      }}>
        <Navbar />
        <main>
          <Hero isReady={!isLoading} />
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionVariants}
          >
            <About />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionVariants}
          >
            <FacultyMembers />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionVariants}
          >
            <StudentMentors />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={sectionVariants}
          >
            <StudentMembers />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionVariants}
          >
            <Events />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionVariants}
          >
            <Projects />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionVariants}
          >
            <Gallery />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionVariants}
          >
            <Footer />
          </motion.div>
        </main>
      </div>
    </>
  );
}
