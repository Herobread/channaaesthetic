"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import { ChevronRight, MapPin } from "lucide-react";

export default function LocationPicker() {
  const { locations, isLoading, selectedLocationId, setLocationId } =
    useClinicLocations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-between gap-3 bg-white border border-[#EBE5DF] rounded-xl px-4 py-2.5 shadow-xs animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#EBE5DF] rounded-full" />
          <div className="w-24 h-3.5 bg-[#EBE5DF] rounded" />
        </div>
        <div className="w-32 h-7 bg-[#FAFAF8] border border-[#EBE5DF] rounded-lg" />
      </div>
    );
  }

  if (locations.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-[#EBE5DF] rounded-xl px-4 py-2.5 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8C827A] shrink-0">
        <MapPin className="w-4 h-4 text-[#B8925D]" />
        <span>Clinic Location</span>
      </div>

      <div className="relative">
        <select
          value={selectedLocationId || ""}
          onChange={(e) => setLocationId(e.target.value)}
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
