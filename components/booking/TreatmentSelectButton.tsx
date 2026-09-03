"use client";

import { Check, Plus } from "lucide-react";

interface TreatmentSelectButtonProps {
  isSelected: boolean;
  onToggle: () => void;
  ariaLabel?: string;
}

export default function TreatmentSelectButton({
  isSelected,
  onToggle,
  ariaLabel = "treatment",
}: TreatmentSelectButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      aria-label={isSelected ? `Remove ${ariaLabel}` : `Select ${ariaLabel}`}
      className={`relative rounded-xl text-xs font-medium transition-colors duration-250 cursor-pointer border shadow-xs overflow-hidden ${
        isSelected
          ? "bg-[#B8925D] text-white border-[#B8925D]"
          : "bg-[#FAFAF8] text-[#1A1A1A] border-[#EBE5DF] hover:border-[#B8925D] hover:bg-white"
      }`}
    >
      {/* 1. INVISIBLE STRUCTURAL ANCHOR (Zero Layout Shift) */}
      <div className="invisible flex items-center justify-center gap-1.5 px-4 py-2 pointer-events-none aria-hidden">
        <span className="w-3.5 h-3.5 shrink-0" />
        <span>Selected</span>
      </div>

      {/* 2. REAL ANIMATED CONTENT */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Leading Icon Swap (+ -> ✓) */}
        <span className="relative w-3.5 h-3.5 mr-1.5 shrink-0">
          <Plus
            className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-200 ${
              isSelected
                ? "opacity-0 rotate-90 scale-75"
                : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <Check
            className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-200 ${
              isSelected
                ? "opacity-100 scale-100"
                : "opacity-0 -rotate-45 scale-75"
            }`}
          />
        </span>

        {/* Root word (Static) */}
        <span>Select</span>

        {/* Animated "ed" expansion */}
        <span
          className={`grid transition-[grid-template-columns,opacity] duration-200 ease-out ${
            isSelected
              ? "grid-cols-[1fr] opacity-100"
              : "grid-cols-[0fr] opacity-0"
          }`}
        >
          <span className="overflow-hidden whitespace-nowrap">ed</span>
        </span>
      </div>
    </button>
  );
}
