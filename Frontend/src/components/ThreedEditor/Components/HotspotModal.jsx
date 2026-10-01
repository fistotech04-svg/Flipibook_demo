import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

const PRESET_COLORS = [
  { name: "Indigo", hex: "#5d5efc" },
  { name: "Cyan", hex: "#00aaff" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Purple", hex: "#a855f7" }
];

export default function HotspotModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  selectedMesh = null,
  nextNumber = 1
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#5d5efc");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setLabel(initialData.label || "");
        setDescription(initialData.description || "");
        setColor(initialData.color || "#5d5efc");
      } else {
        const meshName = selectedMesh?.name || selectedMesh?.meshName || "";
        // Default to mesh name or "mesh X"
        const defaultLabel = meshName ? meshName : `mesh ${nextNumber}`;
        setLabel(defaultLabel);
        setDescription("");
        setColor("#5d5efc");
      }
      setError("");
    }
  }, [isOpen, initialData, selectedMesh, nextNumber]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("Please enter a label for this hotspot");
      return;
    }

    onSave({
      label: label.trim(),
      description: description.trim(),
      color
    });
    onClose();
  };

  const meshDisplay = selectedMesh?.name || selectedMesh?.meshName || initialData?.meshName || "Selected Mesh";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20"
              style={{ backgroundColor: color }}
            >
              <Icon icon="solar:map-point-wave-bold-duotone" width="18px" height="18px" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {initialData ? "Edit Hotspot Label" : "Add Mesh Hotspot"}
              </h3>
              <p className="text-[11px] text-gray-500">
                Attached to <span className="font-semibold text-gray-700">{meshDisplay}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Icon icon="heroicons:x-mark" width="16px" height="16px" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Label Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Hotspot Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Premium Leather Seat, Headlight, Engine"
              className={`w-full px-3.5 py-2.5 bg-gray-50/60 border rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none transition-all ${
                error
                  ? "border-red-400 ring-2 ring-red-100"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                <Icon icon="solar:danger-triangle-bold" width="12px" />
                {error}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key features, specifications, or details about this part..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Pin Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Pin Color
            </label>
            <div className="flex items-center gap-2.5 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    color === c.hex
                      ? "ring-2 ring-offset-2 ring-gray-900 scale-110 shadow-md"
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {color === c.hex && (
                    <Icon icon="heroicons:check" width="14px" height="14px" className="text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#5d5efc] hover:bg-[#4d4eec] shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Icon icon="solar:check-circle-bold" width="14px" height="14px" />
              <span>{initialData ? "Update Hotspot" : "Add Hotspot"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
