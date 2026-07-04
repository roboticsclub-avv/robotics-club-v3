"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Team from "@/components/Team";
import Events from "@/components/Events";
import Projects from "@/components/Projects";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /* ===== Reveal animation on scroll ===== */
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

    // Assuming some sections might have .fade-in inside them, or we can wrap the components
    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el);
    });

    /* ===== Keyboard shortcut: J to scroll to contact ===== */
    const handleKeyDown = (e) => {
      if (
        e.key === "j" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading]);

  return (
    <>
      <LoadingScreen onFinish={() => setIsLoading(false)} />
      <div style={{
        opacity: isLoading ? 0 : 1,
        visibility: isLoading ? 'hidden' : 'visible',
        transition: 'opacity 0.8s ease-out',
        pointerEvents: isLoading ? 'none' : 'auto'
      }}>
        <Navbar />
        <main>
          <Hero isReady={!isLoading} />
          <div className="fade-in"><About /></div>
          <div className="fade-in"><Team /></div>
          <div className="fade-in"><Events /></div>
          <div className="fade-in"><Projects /></div>
          <div className="fade-in"><Footer /></div>
        </main>
      </div>
    </>
  );
}
