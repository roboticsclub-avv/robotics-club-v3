"use client";

import styles from "./Hero.module.css";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
// Lazy load spline to improve performance on main thread
const Spline = dynamic(() => import('@splinetool/react-spline'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.cubeScene}>
                <div className={styles.cube}>
                    {/* Simplified loading indicator instead of heavy CSS 3D */}
                    <div style={{ color: 'var(--accent-purple)', fontFamily: 'var(--font-orbitron)' }}>
                        LOADING ASSETS...
                    </div>
                </div>
            </div>
        </div>
    )
});

function CubePlaceholder() {
    /* CSS 3D cube mimicking the reference metallic Rubik's cube */
    const faces = ["front", "back", "right", "left", "top", "bottom"];
    const glowPattern = [
        ["", "", "", "", "glow1", "", "", "", "glow2"],
        ["glow3", "", "", "", "", "", "glow1", "", ""],
        ["", "glow2", "", "", "", "glow3", "", "", ""],
        ["", "", "glow1", "", "", "", "", "glow3", ""],
        ["", "", "", "glow2", "", "", "", "", "glow1"],
        ["glow3", "", "", "", "glow1", "", "", "glow2", ""],
    ];

    return (
        <div className={styles.cubeScene}>
            <div className={styles.cube}>
                {faces.map((face, fi) => (
                    <div key={face} className={`${styles.cubeFace} ${styles[face]}`}>
                        {glowPattern[fi].map((glow, ci) => (
                            <div
                                key={ci}
                                className={`${styles.cubeCell} ${glow ? styles[glow] : ""}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className={styles.cubeGlow} />
        </div>
    );
}

export default function Hero({ isReady }) {
    const [isRecruiting, setIsRecruiting] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('id', 'is_recruiting')
                    .single();
                if (data) setIsRecruiting(data.value);
            } catch (err) {
                console.error("Error fetching recruitment setting:", err);
            }
        };
        fetchSettings();

        const textElement = document.querySelector('.typewriter-text');
        if (!textElement) return;

        const phrases = ["CODE.\nCONSTRUCT.\nCONQUER.", "INNOVATE.\nBUILD.\nINSPIRE."];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingDelay = 100;

        function type() {
            if (!textElement) return;
            const currentPhrase = phrases[phraseIndex];

            // Safely get substring up to charIndex
            const subStr = currentPhrase.substring(0, charIndex);

            // Split into lines based on where \n is
            const lines = subStr.split('\n');

            // If we are on the last line of the phrase
            const isTypingLastLine = lines.length === currentPhrase.split('\n').length;

            if (isTypingLastLine && lines[lines.length - 1].length > 0) {
                // Wrap the last line (the last word) in the gradient span
                const precedingLines = lines.slice(0, lines.length - 1);
                const lastLine = lines[lines.length - 1];

                let html = precedingLines.join('<br/>');
                if (precedingLines.length > 0) html += '<br/>';
                html += `<span class="${styles.heroTitleAccent}">${lastLine}</span>`;
                textElement.innerHTML = html;
            } else {
                // Otherwise normal typing
                textElement.innerHTML = subStr.replace(/\n/g, '<br/>');
            }

            // Determine typing speed
            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && charIndex === currentPhrase.length) {
                // Pause at the end of a phrase
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typeSpeed = 500;
            }

            // Adjust char index
            charIndex += isDeleting ? -1 : 1;

            setTimeout(type, typeSpeed);
        }

        const timeout = setTimeout(type, 1000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <section className={styles.hero} id="home">
            <div className={styles.heroContainer}>
                <div className={styles.heroContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div
                            className={styles.badge}
                            style={!isRecruiting ? {
                                borderColor: 'rgba(34, 197, 94, 0.3)',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                marginBottom: 0
                            } : { marginBottom: 0 }}
                        >
                            <span
                                className={styles.badgeDot}
                                style={!isRecruiting ? { backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' } : {}}
                            />
                            {isRecruiting ? "Now Recruiting Members" : "Welcome Club Members"}
                        </div>
                    </div>

                    <h1 className={styles.heroTitle}>
                        <span className={`typewriter-text ${styles.typewriterText}`} />
                    </h1>

                    <p className={styles.heroDescription}>
                        Join our community of makers, engineers, and dreamers who are
                        shaping the future of automation.
                    </p>

                    <div className={styles.heroCta}>
                        <a href="#contact" className={styles.ctaPrimary}>
                            Join the Club <span>→</span>
                        </a>
                        <a href="#projects" className={styles.ctaSecondary}>
                            View Projects
                        </a>
                    </div>

                    <div className={styles.shortcut}>
                        Press <span className={styles.key}>J</span> to join instantly
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    {isReady ? (
                        <div className={styles.splineWrapper}>
                            <Spline scene={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/scene.splinecode`} />
                        </div>
                    ) : (
                        <CubePlaceholder />
                    )}
                </div>
            </div>
        </section>
    );
}
