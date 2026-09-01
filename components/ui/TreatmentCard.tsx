"use client";

import { MappedTreatment } from "@/api/useTreatments";
import { Clock, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

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
      className={`group relative bg-white rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-200 ${
        isSelected
          ? "border-[#B8925D] ring-2 ring-[#B8925D]/20 shadow-md bg-[#FAFAF8]/40"
          : "border-[#EBE5DF] hover:border-[#B8925D]/60 hover:shadow-xs shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]"
      }`}
    >
      {/* 1. 1:1 Aspect Image with Max-Height Constraint */}
      {/* Strict Full-Width 1:1 Square (Height strictly equals width) */}
      {treatment.imageUrl ? (
        <div className="relative w-full aspect-square bg-[#F2EFE9] overflow-hidden">
          <Image
            src={treatment.imageUrl}
            alt={treatment.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-white/90 backdrop-blur-md text-[#1A1A1A] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
              {treatment.category}
            </span>
            {treatment.featured && (
              <span className="bg-[#B8925D] text-white text-[10px] font-medium uppercase px-2.5 py-1 rounded-md shadow-xs">
                Recommended
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-6 px-6 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C827A]">
            {treatment.category}
          </span>
        </div>
      )}

      {/* 2. Content Body */}
      <div className="p-6 space-y-2.5 flex-1">
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A] group-hover:text-[#B8925D] transition-colors">
          {treatment.title}
        </h3>

        <p className="text-sm text-[#666666] font-light leading-relaxed">
          {treatment.desc}
        </p>
      </div>

      {/* 3. Footer / Price & Stepper */}
      <div className="px-6 pb-6 pt-4 border-t border-[#EBE5DF] flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-[#1A1A1A]">
              {treatment.price}
            </span>
            <span className="text-xs text-[#8C827A]">•</span>
            <span className="flex items-center gap-1 text-xs text-[#8C827A]">
              <Clock className="w-3.5 h-3.5 text-[#B8925D]" /> {treatment.time}
            </span>
          </div>

          {treatment.deposit && treatment.priceNum > 0 && (
            <span className="text-[11px] text-[#8C827A] font-light">
              {treatment.deposit} deposit to reserve
            </span>
          )}
        </div>

        {/* Stepper / Add Button */}
        {isSelected ? (
          <div className="flex items-center gap-2 bg-white border border-[#B8925D] rounded-xl p-1 shadow-xs">
            <button
              onClick={() => onDecrement(treatment.id)}
              aria-label="Decrease quantity"
              className="w-7 h-7 rounded-lg bg-[#FAFAF8] hover:bg-[#EBE5DF] text-[#1A1A1A] flex items-center justify-center transition cursor-pointer"
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
              className="w-7 h-7 rounded-lg bg-[#B8925D] hover:bg-[#9E7B4C] text-white flex items-center justify-center transition cursor-pointer"
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
