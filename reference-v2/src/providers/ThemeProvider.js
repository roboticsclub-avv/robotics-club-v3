"use client";

import React, { useEffect } from "react";
import useThemeStore from "@/lib/theme-store";

export default function ThemeProvider({ children }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // On first mount, also read localStorage directly to avoid flash before Zustand hydrates
    const stored = (() => {
      try {
        const raw = localStorage.getItem("rc-theme");
        if (raw) return JSON.parse(raw)?.state?.theme;
      } catch {}
      return null;
    })();

    const activeTheme = stored || theme;
    const root = document.documentElement;
    root.classList.remove("theme-cosmic", "theme-aurora", "theme-deepspace");
    root.classList.add(activeTheme);
  }, [theme]);

  return <>{children}</>;
}
