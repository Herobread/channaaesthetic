"use client";

import { wixClient } from "@/lib/wixClient";
import { useAppStore } from "@/store/useAppStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export interface ClinicLocation {
  id: string;
  name: string;
  city: string;
}

async function fetchClinicLocations(): Promise<ClinicLocation[]> {
  // 1. Get an active service to check availability against
  const servicesRes = await wixClient.services.queryServices().find();
  if (!servicesRes.items.length) return [];

  const activeServiceId = servicesRes.items[0]._id!;

  // 2. Query 30 days of slots to extract all available clinic locations
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(now.getDate() + 30);

  const availabilityRes =
    await wixClient.availabilityCalendar.queryAvailability({
      filter: {
        serviceId: [activeServiceId],
        startDate: now.toISOString(),
        endDate: nextMonth.toISOString(),
      },
    });

  // 3. Extract unique locations from slot entries
  const locMap = new Map<string, ClinicLocation>();

  availabilityRes.availabilityEntries?.forEach((entry: any) => {
    const loc = entry.slot?.location;
    if (loc && loc._id && !locMap.has(loc._id)) {
      locMap.set(loc._id, {
        id: loc._id,
        name: loc.name,
        city: loc.name.includes("Glasgow")
          ? "Glasgow"
          : loc.name.includes("London")
            ? "London"
            : loc.name,
      });
    }
  });

  return Array.from(locMap.values());
}

export function useClinicLocations() {
  const selectedLocationId = useAppStore((state) => state.selectedLocationId);
  const setLocationId = useAppStore((state) => state.setLocationId);

  const {
    data: locations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["clinic-locations"],
    queryFn: fetchClinicLocations,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Auto-select the first location if none is set or if the cached selection is invalid
  useEffect(() => {
    if (locations.length > 0) {
      const isSelectedValid = locations.some(
        (loc) => loc.id === selectedLocationId,
      );
      if (!selectedLocationId || !isSelectedValid) {
        setLocationId(locations[0].id);
      }
    }
  }, [locations, selectedLocationId, setLocationId]);

  return {
    locations,
    isLoading,
    isError,
    error,
    refetch,
    selectedLocationId,
    setLocationId,
  };
}
