import { create } from "zustand";

const useAlertStore = create((set) => ({
  isOpen: false,
  type: "alert",
  title: "",
  message: "",
  onConfirm: null,
  onCancel: null,
  onClose: null,
  showAlert: (message, title = "Notice") =>
    new Promise((resolve) => {
      set({
        isOpen: true,
        type: "alert",
        title,
        message,
        onClose: () => {
          set({ isOpen: false });
          resolve();
        },
      });
    }),
  showConfirm: (message, title = "Confirm") =>
    new Promise((resolve) => {
      set({
        isOpen: true,
        type: "confirm",
        title,
        message,
        onConfirm: () => {
          set({ isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          set({ isOpen: false });
          resolve(false);
        },
      });
    }),
}));

export default useAlertStore;
