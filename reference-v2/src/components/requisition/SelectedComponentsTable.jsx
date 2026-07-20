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
    <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4 font-inter">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="font-orbitron text-sm font-bold text-gray-200 tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          SELECTED HARDWARE REQUISITION ITEMS ({selectedItems.length})
        </h3>
        <span className="text-xs text-gray-500 font-mono">
          Total Items: {selectedItems.reduce((acc, i) => acc + (i.qty || 1), 0)}
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {selectedItems.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl space-y-2">
          <div className="text-3xl text-gray-600">📦</div>
          <p className="text-xs text-gray-400 font-medium">
            No components added to requisition list yet.
          </p>
          <p className="text-xs text-gray-600">
            Use the Component Selector above to add hardware items.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-gray-400 font-mono">
                <th className="py-3 px-3">Component</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3">User Manual</th>
                <th className="py-3 px-3">Remarks</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-white">
              {selectedItems.map((item, index) => {
                const stockAvailable = item.availableQuantity ?? item.available_at_request_time ?? 0;
                const isOverStock = item.qty > stockAvailable;

                return (
                  <tr key={`${item.id}-${index}`} className="hover:bg-white/[0.02] transition">
                    {/* Component Info & Thumbnail */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex-shrink-0 flex items-center justify-center">
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
                          <span className="font-semibold text-gray-200 block">{item.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            Stock: {stockAvailable} available
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px]">
                        {item.category || "General"}
                      </span>
                    </td>

                    {/* Quantity Input */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={stockAvailable}
                        value={item.qty}
                        onChange={(e) => handleQtyChange(index, e.target.value)}
                        className={`w-16 text-center bg-black/40 border rounded-lg px-2 py-1 text-xs text-white focus:outline-none ${
                          isOverStock
                            ? "border-red-500 bg-red-950/30 text-red-300"
                            : "border-white/10 focus:border-purple-500"
                        }`}
                      />
                      {isOverStock && (
                        <span className="block text-[9px] text-red-400 mt-0.5">Exceeds stock</span>
                      )}
                    </td>

                    {/* Manual Link */}
                    <td className="py-3 px-3">
                      {item.manual_url ? (
                        <a
                          href={item.manual_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
                        >
                          📄 Manual
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-500 italic">Coming Soon</span>
                      )}
                    </td>

                    {/* Remarks Input */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Notes..."
                        value={item.remarks || ""}
                        onChange={(e) => handleRemarksChange(index, e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[11px] transition"
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
