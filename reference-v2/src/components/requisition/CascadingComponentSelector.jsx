"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function CascadingComponentSelector({ onAddComponent, selectedItems, onActiveComponentChange }) {
  const [categories, setCategories] = useState([]);
  const [hardwareItems, setHardwareItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedHardwareId, setSelectedHardwareId] = useState("");
  const [requestQty, setRequestQty] = useState(1);
  const [itemRemarks, setItemRemarks] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch Categories & All Hardware Items on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: catData } = await supabase.from("inventory_categories").select("*");
        if (catData && catData.length > 0) {
          setCategories(catData);
        } else {
          setCategories([
            { id: "cat-1", name: "Microcontrollers", slug: "microcontrollers" },
            { id: "cat-2", name: "Sensors", slug: "sensors" },
            { id: "cat-3", name: "Motors & Actuators", slug: "motors" },
            { id: "cat-4", name: "Power & Batteries", slug: "power" },
            { id: "cat-5", name: "Miscellaneous", slug: "miscellaneous" },
          ]);
        }

        const { data: hwData } = await supabase.from("hardware").select("*");
        if (hwData) {
          setHardwareItems(hwData);
        }
      } catch (err) {
        console.error("Error fetching inventory for requisition selector:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredHardware = hardwareItems.filter((item) => {
    if (!selectedCategory) return true;
    return (
      item.category === selectedCategory ||
      item.category_id === selectedCategory ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  const activeHardware = hardwareItems.find((h) => h.id === selectedHardwareId);

  useEffect(() => {
    if (onActiveComponentChange) {
      onActiveComponentChange(activeHardware || null);
    }
  }, [selectedHardwareId, activeHardware, onActiveComponentChange]);

  const availableStock = activeHardware ? activeHardware.availableQuantity ?? activeHardware.totalQuantity ?? 0 : 0;

  const alreadyAddedQty = selectedItems
    .filter((i) => i.id === selectedHardwareId)
    .reduce((sum, i) => sum + i.qty, 0);

  const totalRequested = alreadyAddedQty + requestQty;
  const remainingStock = Math.max(0, availableStock - totalRequested);

  const handleAdd = () => {
    if (!activeHardware) return;
    if (requestQty <= 0) return;
    if (requestQty > availableStock - alreadyAddedQty) return;

    onAddComponent({
      id: activeHardware.id,
      hardware_id: activeHardware.id,
      name: activeHardware.name,
      category: activeHardware.category || selectedCategory || "General",
      availableQuantity: availableStock,
      available_at_request_time: availableStock,
      qty: requestQty,
      remarks: itemRemarks,
      image: activeHardware.image,
      manual_url: activeHardware.manual_url,
      specs: activeHardware.specs,
    });

    setSelectedHardwareId("");
    setRequestQty(1);
    setItemRemarks("");
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 font-inter">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
        <h3 className="font-orbitron text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-wider flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-purple)]" />
          COMPONENT SELECTION & INVENTORY CATALOG
        </h3>
        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">Step 2 of 3</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dropdown 1: Category */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold block font-inter">
            1. Select Component Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedHardwareId("");
            }}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200"
          >
            <option value="" className="bg-[var(--bg-primary)] text-[var(--text-secondary)]">
              -- All Inventory Categories ({categories.length}) --
            </option>
            {categories.map((cat) => (
              <option key={cat.id || cat.slug} value={cat.name} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Specific Component */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold block font-inter">
            2. Select Hardware Component
          </label>
          <select
            disabled={loading || filteredHardware.length === 0}
            value={selectedHardwareId}
            onChange={(e) => {
              setSelectedHardwareId(e.target.value);
              setRequestQty(1);
            }}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition duration-200 disabled:opacity-50"
          >
            <option value="" disabled className="bg-[var(--bg-primary)] text-[var(--text-secondary)]">
              {loading
                ? "Loading Hardware Catalog..."
                : filteredHardware.length === 0
                ? "No Components in Selected Category"
                : "-- Choose Component --"}
            </option>
            {filteredHardware.map((item) => (
              <option key={item.id} value={item.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                {item.name} (Available: {item.availableQuantity ?? item.totalQuantity ?? 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Hardware Details Card */}
      {activeHardware && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--border-card)] bg-[var(--bg-primary)] flex-shrink-0 flex items-center justify-center">
                {activeHardware.image ? (
                  <Image
                    src={activeHardware.image}
                    alt={activeHardware.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-2xl text-[var(--accent-purple)] font-mono font-bold">
                    ⚙️
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[var(--text-primary)] font-bold text-base">{activeHardware.name}</h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-inter">
                  Category: <span className="text-[var(--accent-purple)] font-semibold">{activeHardware.category || "General"}</span>
                </p>
                {activeHardware.specs && (
                  <p className="text-xs font-mono text-[var(--text-muted)] mt-1">{activeHardware.specs}</p>
                )}
              </div>
            </div>

            {/* Component Manual Link */}
            <div className="sm:text-right">
              {activeHardware.manual_url ? (
                <div className="flex items-center gap-2">
                  <a
                    href={activeHardware.manual_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-[var(--accent-purple-glow)] text-[var(--accent-purple)] border border-[var(--border-card)] hover:opacity-90 transition"
                  >
                    📄 View Manual
                  </a>
                  <a
                    href={activeHardware.manual_url}
                    download
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-[var(--accent-teal-glow)] text-[var(--accent-teal)] border border-[var(--border-card)] hover:opacity-90 transition"
                  >
                    ⬇ Download
                  </a>
                </div>
              ) : (
                <span className="text-xs font-mono text-[var(--text-muted)] px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-card)]">
                  User Manual Coming Soon
                </span>
              )}
            </div>
          </div>

          {/* Live Stock Information Badge Bar */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border-card)] text-center text-xs sm:text-sm">
            <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-card)]">
              <span className="text-[var(--text-secondary)] block text-xs">Available Stock</span>
              <span className="text-emerald-500 font-mono font-bold text-base sm:text-lg">{availableStock}</span>
            </div>

            <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-card)]">
              <span className="text-[var(--text-secondary)] block text-xs">Requested</span>
              <span className="text-[var(--accent-purple)] font-mono font-bold text-base sm:text-lg">{requestQty}</span>
            </div>

            <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-card)]">
              <span className="text-[var(--text-secondary)] block text-xs">Remaining Stock</span>
              <span
                className={`font-mono font-bold text-base sm:text-lg ${
                  remainingStock < 0 ? "text-red-400" : "text-[var(--accent-teal)]"
                }`}
              >
                {remainingStock}
              </span>
            </div>
          </div>

          {/* Quantity Input & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold block mb-1">
                Select Quantity
              </label>
              <input
                type="number"
                min={1}
                max={availableStock - alreadyAddedQty}
                value={requestQty}
                onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-card)] rounded-xl px-3 py-2.5 text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold block mb-1">
                Component Remarks / Specific Model Notes <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Need 16MHz DIP package version with header pins"
                value={itemRemarks}
                onChange={(e) => setItemRemarks(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-card)] rounded-xl px-3 py-2.5 text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]"
              />
            </div>
          </div>

          {/* Add Component Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={requestQty > availableStock - alreadyAddedQty || availableStock <= 0}
              className="px-6 py-3 rounded-xl bg-[var(--accent-purple)] hover:brightness-110 text-[var(--bg-primary)] font-bold text-xs sm:text-sm font-orbitron tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent-purple-glow)] cursor-pointer active:scale-[0.98]"
            >
              + ADD COMPONENT TO REQUISITION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
