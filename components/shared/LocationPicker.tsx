"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import { Select } from "@base-ui-components/react/select";
import { Check, ChevronDown, MapPin } from "lucide-react";
import Shimmer from "../ui/Shimmer";

interface LocationPickerProps {
  className?: string;
}

export default function LocationPicker({
  className = "",
}: LocationPickerProps) {
  const {
    locations = [],
    isLoading,
    selectedLocationId,
    setLocationId,
  } = useClinicLocations();

  if (isLoading) {
    return (
      <div
        className={`h-11 w-full bg-surface-elevated border border-border-subtle rounded-control px-3.5 flex items-center gap-2 ${className}`}
      >
        <Shimmer className="w-4 h-4 rounded-full shrink-0" />
        <Shimmer className="h-4 w-28 rounded-sm" />
        <Shimmer className="w-4 h-4 rounded-sm ml-auto shrink-0" />
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
      <Select.Trigger
        className={`group inline-flex items-center justify-between gap-2.5 h-11 px-3.5 bg-surface-elevated hover:bg-surface-subtle/50 border border-border-subtle hover:border-accent-champagne rounded-control shadow-subtle cursor-pointer focus-ring text-body transition-colors ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <MapPin className="w-4 h-4 text-accent shrink-0" />
          <Select.Value className="truncate text-left">
            <span className="text-caption font-medium text-text-primary truncate">
              {activeLocation?.name || "Select location"}
            </span>
            {activeLocation?.city && (
              <span className="text-caption text-text-muted ml-1.5 font-normal hidden sm:inline">
                • {activeLocation.city}
              </span>
            )}
          </Select.Value>
        </div>

        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-primary group-data-popup-open:rotate-180 transition-transform shrink-0" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} align="start" className="z-50">
          <Select.Popup className="min-w-56 max-w-72 overflow-hidden rounded-control bg-surface-elevated border border-border-subtle shadow-elevated p-1">
            <Select.List className="space-y-0.5">
              {locations.map((loc) => (
                <Select.Item
                  key={loc.id}
                  value={loc.id}
                  className="group/item flex items-center justify-between gap-3 rounded-sm px-3 py-2 text-left cursor-pointer outline-none data-highlighted:bg-surface-subtle data-selected:bg-surface-subtle transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <Select.ItemText className="text-caption font-medium text-text-primary truncate group-data-selected/item:text-accent">
                      {loc.name}
                    </Select.ItemText>
                    {loc.city && (
                      <span className="text-caption text-text-muted leading-tight">
                        {loc.city}
                      </span>
                    )}
                  </div>

                  <Select.ItemIndicator>
                    <Check className="w-4 h-4 text-accent shrink-0" />
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
