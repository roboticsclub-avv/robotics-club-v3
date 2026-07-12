"use client";

import React, { useEffect } from "react";
import useThemeStore from "@/lib/theme-store";

export default function ThemeProvider({ children }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Sync class tag on document root element
    const root = document.documentElement;
    root.classList.remove("theme-cosmic", "theme-aurora", "theme-deepspace");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
