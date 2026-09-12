"use client";

import { useAppStore } from "@/store/useAppStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

export interface ClinicLocation {
  id: string;
  name: string;
  city: string;
  address?: string;
  phoneNumber?: string;
}

async function fetchClinicLocations(): Promise<ClinicLocation[]> {
  const res = await fetch("/api/locations");
  if (!res.ok) {
    throw new Error("Failed to load clinic locations from Square");
  }
  return res.json();
}

export function useClinicLocations() {
  const selectedLocationId = useAppStore((state) => state.selectedLocationId);
  const setSelectedLocationId = useAppStore(
    (state) => state.setSelectedLocationId,
  );

  const {
    data: locations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["clinic-locations-square"],
    queryFn: fetchClinicLocations,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Stable string key of IDs (e.g. "LOC_1,LOC_2")
  const locationIdsKey = useMemo(
    () => locations.map((l) => l.id).join(","),
    [locations],
  );

  useEffect(() => {
    if (!locations.length) return;

    const currentSavedId = useAppStore.getState().selectedLocationId;
    const isSelectedValid = locations.some((loc) => loc.id === currentSavedId);

    // Fall back to the first available location if missing or invalid
    if (!currentSavedId || !isSelectedValid) {
      const fallbackId = locations[0].id;
      if (fallbackId && fallbackId !== currentSavedId) {
        setSelectedLocationId(fallbackId);
      }
    }
  }, [locationIdsKey, setSelectedLocationId, locations]);
  // Dependency strictly tracks key changes, not reference mutations

  return {
    locations,
    isLoading,
    isError,
    error,
    refetch,
    selectedLocationId,
    setLocationId: setSelectedLocationId,
  };
}
