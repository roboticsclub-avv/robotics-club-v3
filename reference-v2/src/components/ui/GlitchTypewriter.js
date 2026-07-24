"use client";

import React, { useState, useEffect } from "react";
import styles from "./GlitchTypewriter.module.css";

const SETS = [
  ["INNOVATE.", "BUILD.", "INSPIRE."],
  ["CODE.", "CONSTRUCT.", "CONQUER."]
];

export default function GlitchTypewriter() {
  const [setIndex, setSetIndex] = useState(0);
  const [texts, setTexts] = useState(["", "", ""]);
  const [phase, setPhase] = useState("type1"); 
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    let timeout;
    const currentSet = SETS[setIndex];

    if (phase === "type1") {
      if (texts[0].length < currentSet[0].length) {
        timeout = setTimeout(() => {
          setTexts([currentSet[0].slice(0, texts[0].length + 1), "", ""]);
        }, 80);
      } else {
        timeout = setTimeout(() => setPhase("type2"), 0);
      }
    } else if (phase === "type2") {
      if (texts[1].length < currentSet[1].length) {
        timeout = setTimeout(() => {
          setTexts([texts[0], currentSet[1].slice(0, texts[1].length + 1), ""]);
        }, 80);
      } else {
        timeout = setTimeout(() => setPhase("type3"), 0);
      }
    } else if (phase === "type3") {
      if (texts[2].length < currentSet[2].length) {
        timeout = setTimeout(() => {
          setTexts([texts[0], texts[1], currentSet[2].slice(0, texts[2].length + 1)]);
        }, 80);
      } else {
        timeout = setTimeout(() => setPhase("hold"), 0);
      }
    } else if (phase === "hold") {
      timeout = setTimeout(() => {
        setPhase("erase");
        setIsGlitching(true);
      }, 2500);
    } else if (phase === "erase") {
      if (texts[0].length > 0 || texts[1].length > 0 || texts[2].length > 0) {
        timeout = setTimeout(() => {
          setTexts([
            texts[0].slice(0, Math.max(0, texts[0].length - 1)),
            texts[1].slice(0, Math.max(0, texts[1].length - 1)),
            texts[2].slice(0, Math.max(0, texts[2].length - 1))
          ]);
        }, 50);
      } else {
        setIsGlitching(false);
        timeout = setTimeout(() => setPhase("transition"), 0);
      }
    } else if (phase === "transition") {
      timeout = setTimeout(() => {
        setSetIndex((prev) => (prev + 1) % SETS.length);
        setPhase("type1");
      }, 800);
    }

    return () => clearTimeout(timeout);
  }, [texts, phase, setIndex]);

  return (
    <div className={`${styles.container} ${isGlitching ? styles.glitchActive : ""}`}>
      <span className={styles.line} data-text={texts[0]}>
        {texts[0]}
      </span>
      <span className={styles.line} data-text={texts[1]}>
        {texts[1]}
      </span>
      <span className={`${styles.line} ${styles.gradientLine}`} data-text={texts[2]}>
        {texts[2]}
      </span>
    </div>
  );
}
