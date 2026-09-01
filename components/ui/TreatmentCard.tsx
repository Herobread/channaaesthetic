"use client";

import { MappedTreatment } from "@/api/useTreatments";
import { Clock, Minus, Plus, Trash2 } from "lucide-react";

interface TreatmentCardProps {
  treatment: MappedTreatment;
  quantity?: number;
  onIncrement: (treatment: MappedTreatment) => void;
  onDecrement: (treatmentId: string) => void;
}

export default function TreatmentCard({
  treatment,
  quantity = 0,
  onIncrement,
  onDecrement,
}: TreatmentCardProps) {
  const isSelected = quantity > 0;

  return (
    <div
      className={`group relative bg-white rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 ${
        isSelected
          ? "border-[#B8925D] ring-2 ring-[#B8925D]/20 shadow-md bg-[#FAFAF8]/50"
          : "border-[#EBE5DF] hover:border-[#B8925D]/60 hover:shadow-xs shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="space-y-2.5">
        {/* Top Tag Row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C827A]">
            {treatment.category}
          </span>
          {treatment.featured && (
            <span className="bg-[#B8925D]/10 text-[#B8925D] text-[10px] font-medium uppercase px-2 py-0.5 rounded-md">
              Recommended
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A] group-hover:text-[#B8925D] transition-colors">
          {treatment.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#666666] font-light leading-relaxed line-clamp-3">
          {treatment.desc}
        </p>
      </div>

      {/* Footer / Pricing & Actions */}
      <div className="pt-4 mt-5 border-t border-[#EBE5DF] flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-base text-[#1A1A1A]">
              {treatment.price}
            </span>
            <span className="text-xs text-[#8C827A]">•</span>
            <span className="flex items-center gap-1 text-xs text-[#8C827A]">
              <Clock className="w-3.5 h-3.5 text-[#B8925D]" /> {treatment.time}
            </span>
          </div>

          {/* Deposit Info - Shown directly below price */}
          {treatment.deposit && treatment.priceNum > 0 && (
            <span className="text-[11px] text-[#8C827A] font-light">
              {treatment.deposit} deposit to reserve
            </span>
          )}
        </div>

        {/* Multi-Select Stepper */}
        {isSelected ? (
          <div className="flex items-center gap-2 bg-white border border-[#B8925D] rounded-xl p-1 shadow-xs">
            <button
              onClick={() => onDecrement(treatment.id)}
              aria-label="Decrease quantity"
              className="w-7 h-7 rounded-lg bg-[#FAFAF8] hover:bg-[#EBE5DF] text-[#1A1A1A] flex items-center justify-center transition"
            >
              {quantity === 1 ? (
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
            </button>
            <span className="text-xs font-semibold text-[#1A1A1A] px-1.5 min-w-[18px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onIncrement(treatment)}
              aria-label="Increase quantity"
              className="w-7 h-7 rounded-lg bg-[#B8925D] hover:bg-[#9E7B4C] text-white flex items-center justify-center transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onIncrement(treatment)}
            className="h-9 px-4 rounded-xl bg-[#FAFAF8] hover:bg-[#B8925D] text-[#1A1A1A] hover:text-white border border-[#EBE5DF] hover:border-[#B8925D] text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>
    </div>
  );
}
