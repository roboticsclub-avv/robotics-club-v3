"use client";

import React from "react";
import useTheme from "@/hooks/useTheme";

export default function ThemeSwitcher() {
  const { currentTheme, setTheme, themes } = useTheme();

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case "theme-aurora":
        return "🔋";
      case "theme-deepspace":
        return "🛸";
      case "theme-cosmic":
      default:
        return "🌌";
    }
  };

  const getThemeName = () => {
    switch (currentTheme) {
      case "theme-aurora":
        return "Aurora";
      case "theme-deepspace":
        return "Deep Space";
      case "theme-cosmic":
      default:
        return "Cosmic";
    }
  };

  return (
    <button
      onClick={toggleTheme}
      title={`Active Theme: ${getThemeName()}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "100px",
        border: "1px solid var(--border-card)",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-card-hover)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border-card)";
      }}
    >
      <span>{getThemeIcon()}</span>
      <span>{getThemeName()}</span>
    </button>
  );
}
