"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import { Select } from "@base-ui-components/react/select";
import { Check, ChevronDown, MapPin } from "lucide-react";
import Shimmer from "../ui/Shimmer";

export default function LocationPicker() {
  const {
    locations = [],
    isLoading,
    selectedLocationId,
    setLocationId,
  } = useClinicLocations();

  if (isLoading) {
    return (
      <div className="h-9 w-44 bg-white/60 backdrop-blur-md border border-[#EBE5DF] rounded-xl px-2.5 flex items-center gap-2">
        <Shimmer className="w-3.5 h-3.5 rounded-full shrink-0" />
        <Shimmer className="h-3 w-24 rounded" />
        <Shimmer className="w-3 h-3 rounded ml-auto shrink-0" />
      </div>
    );
  }

  if (!locations || locations.length === 0) return null;

  const activeLocation =
    locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <Select.Root
      value={activeLocation?.id || ""}
      onValueChange={(val) => {
        if (val && val !== selectedLocationId) {
          setLocationId(val);
        }
      }}
    >
      {/* Navbar Trigger */}
      <Select.Trigger className="group inline-flex items-center gap-2 h-9 px-3 bg-white/70 hover:bg-white/95 border border-[#EBE5DF] hover:border-[#DFC095] rounded-xl shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B8925D]/20 focus:border-[#B8925D] max-w-[240px]">
        <MapPin className="w-3.5 h-3.5 text-[#B8925D] shrink-0" />

        <Select.Value className="truncate">
          <span className="text-xs font-medium text-[#1A1A1A] truncate">
            {activeLocation?.name || "Location"}
          </span>
          {activeLocation?.city && (
            <span className="text-[11px] text-[#8C827A] ml-1.5 font-normal hidden sm:inline">
              • {activeLocation.city}
            </span>
          )}
        </Select.Value>

        <Select.Icon>
          <ChevronDown className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#1A1A1A] group-data-popup-open:rotate-180 shrink-0 ml-0.5" />
        </Select.Icon>
      </Select.Trigger>

      {/* Dropdown Popup - instant mount/unmount */}
      <Select.Portal>
        <Select.Positioner sideOffset={6} align="end" className="z-50">
          <Select.Popup className="min-w-55 max-w-70 overflow-hidden rounded-xl bg-white backdrop-blur-2xl border border-[#EBE5DF] shadow-[0_12px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/5 p-1">
            <Select.List className="space-y-0.5">
              {locations.map((loc) => (
                <Select.Item
                  key={loc.id}
                  value={loc.id}
                  className="group/item flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-left cursor-pointer outline-none data-[highlighted]:bg-[#FAFAF8] data-[selected]:bg-[#FAFAF8]"
                >
                  <div className="flex flex-col min-w-0">
                    <Select.ItemText className="text-xs font-semibold text-[#1A1A1A] truncate group-data-selected/item:text-[#B8925D]">
                      {loc.name}
                    </Select.ItemText>
                    {loc.city && (
                      <span className="text-[11px] text-[#8C827A] leading-tight">
                        {loc.city}
                      </span>
                    )}
                  </div>

                  <Select.ItemIndicator>
                    <Check className="w-3.5 h-3.5 text-[#B8925D] shrink-0" />
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
