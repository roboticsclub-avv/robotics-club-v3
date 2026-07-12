import { create } from "zustand";

const useThemeStore = create((set) => ({
  theme: "theme-cosmic",
  setTheme: (newTheme) => set({ theme: newTheme }),
}));

export default useThemeStore;
