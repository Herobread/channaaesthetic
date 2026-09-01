"use client";

import { ClinicLocation } from "@/api/useTreatments";
import { ChevronRight, MapPin } from "lucide-react";

interface LocationPickerProps {
  locations: ClinicLocation[];
  selectedLocationId: string;
  onLocationChange: (id: string) => void;
}

export default function LocationPicker({
  locations,
  selectedLocationId,
  onLocationChange,
}: LocationPickerProps) {
  if (locations.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-[#EBE5DF] rounded-xl px-4 py-2.5 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8C827A] shrink-0">
        <MapPin className="w-4 h-4 text-[#B8925D]" />
        <span>Clinic Location</span>
      </div>

      <div className="relative">
        <select
          value={selectedLocationId}
          onChange={(e) => onLocationChange(e.target.value)}
          aria-label="Select clinic location"
          className="appearance-none bg-[#FAFAF8] border border-[#EBE5DF] rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-[#1A1A1A] cursor-pointer focus:outline-none focus:border-[#B8925D] transition"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C827A] rotate-90 pointer-events-none" />
      </div>
    </div>
  );
}
