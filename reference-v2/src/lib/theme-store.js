import { create } from "zustand";
import { persist } from "zustand/middleware";

const THEMES = ["theme-cosmic", "theme-aurora", "theme-deepspace"];

const useThemeStore = create(
  persist(
    (set) => ({
      theme: "theme-cosmic",
      setTheme: (newTheme) => set({ theme: newTheme }),
      cycleTheme: () =>
        set((state) => {
          const idx = THEMES.indexOf(state.theme);
          return { theme: THEMES[(idx + 1) % THEMES.length] };
        }),
    }),
    {
      name: "rc-theme", // localStorage key
    }
  )
);

export default useThemeStore;
