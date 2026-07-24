"use client";

import useThemeStore from "@/lib/theme-store";

export default function useTheme() {
  const { theme, setTheme } = useThemeStore();
  const themes = ["theme-cosmic", "theme-aurora", "theme-deepspace"];

  return {
    currentTheme: theme,
    setTheme,
    themes,
  };
}
