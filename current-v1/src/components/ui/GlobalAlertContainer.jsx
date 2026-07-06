"use client";

import React from "react";
import useAlertStore from "@/lib/alert-store";

export default function GlobalAlertContainer() {
  const { isOpen, type, title, message, onConfirm, onCancel, onClose } =
    useAlertStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg max-w-sm w-full text-center">
        <h3 className="text-xl font-bold font-orbitron mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-4 justify-center">
          {type === "confirm" ? (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-cyan-600 text-white rounded font-semibold text-xs"
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-white rounded font-semibold text-xs"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
