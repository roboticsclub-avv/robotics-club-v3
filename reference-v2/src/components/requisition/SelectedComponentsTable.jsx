"use client";

import React from "react";
import Image from "next/image";

export default function SelectedComponentsTable({ selectedItems, setSelectedItems, errorMsg }) {
  const handleRemove = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index, newQty) => {
    const validQty = Math.max(1, parseInt(newQty) || 1);
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], qty: validQty };
      return updated;
    });
  };

  const handleRemarksChange = (index, remarks) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], remarks };
      return updated;
    });
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl space-y-4 font-inter">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
        <h3 className="font-orbitron text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-wider flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-teal)]" />
          SELECTED HARDWARE REQUISITION ITEMS ({selectedItems.length})
        </h3>
        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
          Total Items: {selectedItems.reduce((acc, i) => acc + (i.qty || 1), 0)}
        </span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-400 font-medium">
          {errorMsg}
        </div>
      )}

      {selectedItems.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[var(--border-card)] rounded-2xl space-y-2 bg-[var(--bg-secondary)]">
          <div className="text-3xl text-[var(--text-muted)]">📦</div>
          <p className="text-sm text-[var(--text-primary)] font-bold font-orbitron">
            No components added to requisition list yet.
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Use the Component Selector above to add hardware items.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-card)] text-[var(--text-secondary)] font-mono">
                <th className="py-3 px-3">Component</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3">User Manual</th>
                <th className="py-3 px-3">Remarks</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-card)] text-[var(--text-primary)]">
              {selectedItems.map((item, index) => {
                const stockAvailable = item.availableQuantity ?? item.available_at_request_time ?? 0;
                const isOverStock = item.qty > stockAvailable;

                return (
                  <tr key={`${item.id}-${index}`} className="hover:bg-[var(--bg-card-hover)] transition">
                    {/* Component Info & Thumbnail */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[var(--border-card)] bg-[var(--bg-secondary)] flex-shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-sm">⚙️</span>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-[var(--text-primary)] block text-xs sm:text-sm">{item.name}</span>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">
                            Stock: {stockAvailable} available
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--accent-purple-glow)] text-[var(--accent-purple)] border border-[var(--border-card)] text-xs font-medium">
                        {item.category || "General"}
                      </span>
                    </td>

                    {/* Quantity Input */}
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={stockAvailable}
                        value={item.qty}
                        onChange={(e) => handleQtyChange(index, e.target.value)}
                        className={`w-16 text-center bg-[var(--bg-secondary)] border rounded-lg px-2 py-1.5 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none ${
                          isOverStock
                            ? "border-red-500 bg-red-950/30 text-red-300"
                            : "border-[var(--border-card)] focus:border-[var(--accent-purple)]"
                        }`}
                      />
                      {isOverStock && (
                        <span className="block text-[10px] text-red-400 mt-0.5 font-mono">Exceeds stock</span>
                      )}
                    </td>

                    {/* Manual Link */}
                    <td className="py-3.5 px-3">
                      {item.manual_url ? (
                        <a
                          href={item.manual_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent-purple)] hover:underline flex items-center gap-1 font-medium"
                        >
                          📄 Manual
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic font-mono">Coming Soon</span>
                      )}
                    </td>

                    {/* Remarks Input */}
                    <td className="py-3.5 px-3">
                      <input
                        type="text"
                        placeholder="Notes..."
                        value={item.remarks || ""}
                        onChange={(e) => handleRemarksChange(index, e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-medium transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
