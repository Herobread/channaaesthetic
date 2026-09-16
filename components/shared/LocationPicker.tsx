"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import { Menu } from "@base-ui-components/react/menu";
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
        className={`h-11 min-w-44 bg-surface-elevated border border-border-subtle rounded-control px-3.5 flex items-center gap-2 ${className}`.trim()}
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
    <Menu.Root>
      <Menu.Trigger
        aria-label="Select clinic location"
        className={`group w-full h-full min-h-[44px] inline-flex items-center justify-between gap-2.5 px-3.5 bg-surface-elevated hover:bg-surface-subtle/50 border border-border-subtle hover:border-border-focus rounded-control shadow-subtle cursor-pointer focus-ring text-body transition-colors ${className}`.trim()}
      >
        <span className="flex items-center gap-2.5 min-w-0 pointer-events-none">
          <MapPin className="w-4 h-4 text-accent shrink-0" />
          <span className="text-caption font-medium text-text-primary truncate">
            {activeLocation?.name || "Select location"}
            {activeLocation?.city && (
              <span className="text-caption text-text-muted font-normal ml-1.5 hidden sm:inline">
                • {activeLocation.city}
              </span>
            )}
          </span>
        </span>

        <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-transform duration-150 group-data-[popup-open]:rotate-180 shrink-0 pointer-events-none" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50">
          <Menu.Popup className="min-w-[var(--anchor-width,14rem)] max-h-80 overflow-y-auto rounded-control bg-surface-elevated border border-border-subtle shadow-elevated p-1 outline-none transition-all data-[ending-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:scale-95">
            <Menu.RadioGroup
              value={activeLocation?.id || ""}
              onValueChange={(val) => {
                if (val && val !== selectedLocationId) {
                  setLocationId(val);
                }
              }}
              className="space-y-0.5"
            >
              {locations.map((loc) => {
                const isSelected = loc.id === (activeLocation?.id || "");
                return (
                  <Menu.RadioItem
                    key={loc.id}
                    value={loc.id}
                    className="group flex w-full select-none items-center justify-between gap-3 rounded-control px-3 py-2 text-left cursor-pointer outline-none transition-colors data-[highlighted]:bg-surface-subtle"
                  >
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-caption font-medium truncate ${
                          isSelected ? "text-accent" : "text-text-primary"
                        }`}
                      >
                        {loc.name}
                      </span>
                      {loc.city && (
                        <span className="text-caption font-sans text-text-muted leading-tight">
                          {loc.city}
                        </span>
                      )}
                    </div>

                    <Menu.RadioItemIndicator className="shrink-0 text-accent">
                      <Check className="w-4 h-4" />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                );
              })}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
