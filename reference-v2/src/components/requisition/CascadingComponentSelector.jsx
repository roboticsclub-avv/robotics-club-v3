"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function CascadingComponentSelector({ onAddComponent, selectedItems }) {
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

        // Fetch categories
        const { data: catData } = await supabase.from("inventory_categories").select("*");
        if (catData && catData.length > 0) {
          setCategories(catData);
        } else {
          // Default fallback categories
          setCategories([
            { id: "cat-1", name: "Microcontrollers", slug: "microcontrollers" },
            { id: "cat-2", name: "Sensors", slug: "sensors" },
            { id: "cat-3", name: "Motors & Actuators", slug: "motors" },
            { id: "cat-4", name: "Power & Batteries", slug: "power" },
            { id: "cat-5", name: "Miscellaneous", slug: "miscellaneous" },
          ]);
        }

        // Fetch hardware items
        const { data: hwData, error } = await supabase.from("hardware").select("*");
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

  // Filter hardware by selected category name/id
  const filteredHardware = hardwareItems.filter((item) => {
    if (!selectedCategory) return true;
    return (
      item.category === selectedCategory ||
      item.category_id === selectedCategory ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  // Currently selected hardware object
  const activeHardware = hardwareItems.find((h) => h.id === selectedHardwareId);

  // Calculate live stock details
  const availableStock = activeHardware ? activeHardware.availableQuantity ?? activeHardware.totalQuantity ?? 0 : 0;

  // Calculate how many of this item have already been added in the form table
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
      available_at_request_time: availableStock, // Snapshot requirement
      qty: requestQty,
      remarks: itemRemarks,
      image: activeHardware.image,
      manual_url: activeHardware.manual_url,
      specs: activeHardware.specs,
    });

    // Reset selector inputs
    setSelectedHardwareId("");
    setRequestQty(1);
    setItemRemarks("");
  };

  return (
    <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6 font-inter">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="font-orbitron text-sm font-bold text-gray-200 tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          COMPONENT SELECTION & INVENTORY CATALOG
        </h3>
        <span className="text-xs text-gray-500">Step 2 of 3</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dropdown 1: Category */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium block">
            1. Select Component Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedHardwareId("");
            }}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          >
            <option value="" className="bg-gray-900 text-gray-400">
              -- All Inventory Categories ({categories.length}) --
            </option>
            {categories.map((cat) => (
              <option key={cat.id || cat.slug} value={cat.name} className="bg-gray-900 text-white">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Specific Component */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium block">
            2. Select Hardware Component
          </label>
          <select
            disabled={loading || filteredHardware.length === 0}
            value={selectedHardwareId}
            onChange={(e) => {
              setSelectedHardwareId(e.target.value);
              setRequestQty(1);
            }}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
          >
            <option value="" disabled className="bg-gray-900 text-gray-400">
              {loading
                ? "Loading Hardware Catalog..."
                : filteredHardware.length === 0
                ? "No Components in Selected Category"
                : "-- Choose Component --"}
            </option>
            {filteredHardware.map((item) => (
              <option key={item.id} value={item.id} className="bg-gray-900 text-white">
                {item.name} (Available: {item.availableQuantity ?? item.totalQuantity ?? 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Hardware Details Card */}
      {activeHardware && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Component Thumbnail with Graceful Fallback */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex-shrink-0 flex items-center justify-center">
                {activeHardware.image ? (
                  <Image
                    src={activeHardware.image}
                    alt={activeHardware.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-2xl text-purple-400 font-mono font-bold">
                    ⚙️
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-white font-bold text-sm">{activeHardware.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Category: <span className="text-purple-300">{activeHardware.category || "General"}</span>
                </p>
                {activeHardware.specs && (
                  <p className="text-xs font-mono text-gray-500 mt-1">{activeHardware.specs}</p>
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
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition"
                  >
                    📄 View Manual
                  </a>
                  <a
                    href={activeHardware.manual_url}
                    download
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition"
                  >
                    ⬇ Download
                  </a>
                </div>
              ) : (
                <span className="text-xs font-mono text-gray-500 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  User Manual Coming Soon
                </span>
              )}
            </div>
          </div>

          {/* Live Stock Information Badge Bar */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.04] text-center text-xs">
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-gray-500 block">Available Stock</span>
              <span className="text-green-400 font-mono font-bold text-sm">{availableStock}</span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-gray-500 block">Requested</span>
              <span className="text-purple-400 font-mono font-bold text-sm">{requestQty}</span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-gray-500 block">Remaining Stock</span>
              <span
                className={`font-mono font-bold text-sm ${
                  remainingStock < 0 ? "text-red-400" : "text-teal-400"
                }`}
              >
                {remainingStock}
              </span>
            </div>
          </div>

          {/* Quantity Input & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs text-gray-300 font-medium block mb-1">
                Select Quantity
              </label>
              <input
                type="number"
                min={1}
                max={availableStock - alreadyAddedQty}
                value={requestQty}
                onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-gray-300 font-medium block mb-1">
                Component Remarks / Specific Model Notes <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Need 16MHz DIP package version with header pins"
                value={itemRemarks}
                onChange={(e) => setItemRemarks(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Add Component Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={requestQty > availableStock - alreadyAddedQty || availableStock <= 0}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs font-orbitron tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20"
            >
              + ADD COMPONENT TO REQUISITION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
