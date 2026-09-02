"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import { Select } from "@base-ui-components/react/select";
import { Check, ChevronDown, MapPin } from "lucide-react";

export default function LocationPicker() {
  const { locations, isLoading, selectedLocationId, setLocationId } =
    useClinicLocations();

  if (isLoading) {
    return (
      <div className="w-full h-16 bg-white/60 backdrop-blur-xl border border-[#EBE5DF] rounded-2xl px-4 flex items-center justify-between shadow-xs animate-pulse">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 bg-[#EBE5DF] rounded-xl" />
          <div className="space-y-1.5">
            <div className="w-36 h-3.5 bg-[#EBE5DF] rounded-md" />
            <div className="w-20 h-2.5 bg-[#EBE5DF]/60 rounded-md" />
          </div>
        </div>
        <div className="w-4 h-4 bg-[#EBE5DF] rounded" />
      </div>
    );
  }

  if (locations.length === 0) return null;

  return (
    <Select.Root
      value={selectedLocationId || ""}
      onValueChange={(val) => {
        if (val) setLocationId(val);
      }}
    >
      {/* 1. Full-Width Trigger */}
      <Select.Trigger className="group w-full flex items-center justify-between gap-3 bg-white/80 hover:bg-white/95 active:scale-[0.99] backdrop-blur-xl border border-[#EBE5DF] hover:border-[#DFC095] rounded-2xl px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B8925D]/20 focus:border-[#B8925D]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FAFAF8] border border-[#EBE5DF] group-hover:border-[#DFC095]/60 flex items-center justify-center shrink-0 transition-colors">
            <MapPin className="w-4 h-4 text-[#B8925D]" />
          </div>

          <Select.Value>
            {(value) => {
              const current = locations.find((l) => l.id === value);
              return (
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate leading-tight">
                    {current?.name || "Select Clinic Location"}
                  </p>
                  <p className="text-xs text-[#8C827A] font-normal tracking-wide mt-0.5">
                    {current?.city || "Tap to switch location"}
                  </p>
                </div>
              );
            }}
          </Select.Value>
        </div>

        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-[#8C827A] group-hover:text-[#1A1A1A] transition-transform duration-300 ease-out group-data-[popup-open]:rotate-180 shrink-0" />
        </Select.Icon>
      </Select.Trigger>

      {/* 2. Positioner & Popup matching trigger width */}
      <Select.Portal>
        <Select.Positioner sideOffset={6} align="start" className="z-50">
          <Select.Popup className="w-[var(--anchor-width)] overflow-hidden rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5 p-1.5 origin-top transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Select.List className="space-y-1">
              {locations.map((loc) => (
                <Select.Item
                  key={loc.id}
                  value={loc.id}
                  className="group/item flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left cursor-pointer outline-none transition-all duration-150 data-[highlighted]:bg-[#FAFAF8] data-[selected]:bg-[#FAFAF8]/90"
                >
                  <div className="flex flex-col min-w-0">
                    <Select.ItemText className="text-sm font-semibold text-[#1A1A1A] truncate leading-tight group-data-[selected]/item:text-[#B8925D]">
                      {loc.name}
                    </Select.ItemText>
                    {loc.city && (
                      <span className="text-xs text-[#8C827A] font-normal mt-0.5">
                        {loc.city}
                      </span>
                    )}
                  </div>

                  <Select.ItemIndicator>
                    <Check className="w-4 h-4 text-[#B8925D] shrink-0" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
