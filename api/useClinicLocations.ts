"use client";

import { sanityClient } from "@/sanity/lib/sanityClient";
import { useAppStore } from "@/store/useAppStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export interface ClinicLocation {
  id: string;
  name: string;
  city: string;
  address?: string;
}

async function fetchClinicLocations(): Promise<ClinicLocation[]> {
  const query = `*[_type == "clinicLocation"] | order(name asc) {
    "_id": _id,
    "name": name,
    "city": city,
    "address": address
  }`;

  const rawLocations = await sanityClient.fetch(query);

  return (rawLocations || []).map((loc: any) => ({
    id: loc._id,
    name: loc.name || "Clinic Location",
    city: loc.city || "",
    address: loc.address || "",
  }));
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
    queryKey: ["clinic-locations-sanity"],
    queryFn: fetchClinicLocations,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Guarded auto-select: only runs when locations load and selection is invalid
  useEffect(() => {
    if (locations.length === 0) return;

    const isSelectedValid = locations.some(
      (loc) => loc.id === selectedLocationId,
    );

    if (!selectedLocationId || !isSelectedValid) {
      const fallbackId = locations[0].id;
      if (selectedLocationId !== fallbackId) {
        setSelectedLocationId(fallbackId);
      }
    }
  }, [locations, selectedLocationId, setSelectedLocationId]);

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
