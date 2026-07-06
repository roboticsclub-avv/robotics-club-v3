"use client";

import React from "react";

export default function AlertPopup({ isOpen, onClose, title, message, onAction, actionLabel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg max-w-sm w-full text-center">
        <h3 className="text-xl font-bold font-orbitron mb-2 text-white">{title || "Notice"}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold text-xs"
          >
            Close
          </button>
          {onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-cyan-600 text-white rounded font-semibold text-xs"
            >
              {actionLabel || "Proceed"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
