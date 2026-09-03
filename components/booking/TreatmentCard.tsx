"use client";

import { MappedTreatment } from "@/api/useTreatments";
import TreatmentSelectButton from "@/components/booking/TreatmentSelectButton";
import { Clock, Sparkles } from "lucide-react";
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

  const handleToggle = () => {
    if (isSelected) {
      onDecrement(treatment.id);
    } else {
      onIncrement(treatment);
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-300 ${
        isSelected
          ? "border-[#B8925D] ring-2 ring-[#B8925D]/20 shadow-md bg-[#FAFAF8]/40"
          : treatment.featured
            ? "border-[#DFC095]/60 hover:border-[#B8925D] hover:shadow-[0_8px_30px_rgba(184,146,93,0.12)] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]"
            : "border-[#EBE5DF] hover:border-[#B8925D]/60 hover:shadow-xs shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]"
      }`}
    >
      {/* 1. 1:1 Aspect Image with Badge Overlay */}
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

          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="bg-white/95 backdrop-blur-md text-[#1A1A1A] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs border border-white/40">
              {treatment.category}
            </span>

            {treatment.featured && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#C29D68] to-[#A8824C] text-white text-[10px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-md shadow-sm border border-white/20">
                <Sparkles className="w-2.5 h-2.5" />
                Recommended
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-6 px-6 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C827A]">
            {treatment.category}
          </span>

          {treatment.featured && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#C29D68] to-[#A8824C] text-white text-[10px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-md shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              Recommended
            </span>
          )}
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

      {/* 3. Footer / Price & Select Action */}
      <div className="px-6 pb-6 pt-4 border-t border-[#EBE5DF] flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0">
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
            <span className="text-[11px] text-[#8C827A] font-light truncate">
              {treatment.deposit} deposit to reserve
            </span>
          )}
        </div>

        <TreatmentSelectButton
          isSelected={isSelected}
          onToggle={handleToggle}
          ariaLabel={treatment.title}
        />
      </div>
    </div>
  );
}
