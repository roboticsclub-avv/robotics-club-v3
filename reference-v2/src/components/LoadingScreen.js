"use client";

import { useState, useEffect } from 'react';
import styles from './LoadingScreen.module.css';

const words = ["Design.", "Develop.", "Dominate."];

export default function LoadingScreen({ onFinish }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isBoxActive, setIsBoxActive] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Detect prefers-reduced-motion
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        if (mediaQuery.matches) {
            // Speed up loader flow instantly
            setCurrentWordIndex(2);
            setIsBoxActive(true);
            const timer = setTimeout(() => {
                setIsExiting(true);
                if (onFinish) onFinish();
                setTimeout(() => {
                    setIsVisible(false);
                }, 300);
            }, 300);
            return () => clearTimeout(timer);
        }

        // Start the box animation
        setIsBoxActive(true);

        // Sequence the words
        const sequenceWords = async () => {
            // Word 1: Design
            setCurrentWordIndex(0);
            await new Promise(resolve => setTimeout(resolve, 800));

            // Word 2: Develop
            setCurrentWordIndex(1);
            await new Promise(resolve => setTimeout(resolve, 800));

            // Word 3: Dominate
            setCurrentWordIndex(2);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // All words finished, start exit reveal
            setIsExiting(true);

            // Call onFinish quickly so the homepage components can start mounting
            setTimeout(() => {
                if (onFinish) onFinish();
            }, 600);

            // Final cleanup
            setTimeout(() => {
                setIsVisible(false);
            }, 1500);
        };

        const wordTimer = setTimeout(sequenceWords, 300);

        return () => {
            clearTimeout(wordTimer);
        };
    }, [onFinish]);

    if (!isVisible) return null;

    return (
        <div className={`${styles.loadingOverlay} ${isExiting ? styles.loadingOverlayHidden : ""}`}>
            <div className={`
                ${styles.revealBox} 
                ${isBoxActive && !prefersReducedMotion ? styles.revealBoxActive : ""} 
                ${isExiting || prefersReducedMotion ? styles.revealBoxFull : ""}
            `}>
                <div className={styles.wordContainer}>
                    {words.map((word, index) => (
                        <span
                            key={word}
                            className={`
                                ${styles.word} 
                                ${index === currentWordIndex ? styles.wordActive : ""}
                                ${index < currentWordIndex || isExiting ? styles.wordExit : ""}
                            `}
                            style={{
                                transition: prefersReducedMotion ? "none" : undefined
                            }}
                        >
                            {word}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
