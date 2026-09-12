"use client";

import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface ClinicLocation {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface MappedTreatment {
  id: string;
  category: string;
  title: string;
  desc: string;
  time: string;
  durationMinutes: number;
  price: string;
  priceNum: number;
  deposit?: string;
  imageUrl?: string;
  locationIds: string[];
  locations: ClinicLocation[];
  featured?: boolean;
}

export async function fetchTreatmentsPage({
  pageParam,
}: {
  pageParam?: string;
}): Promise<{
  items: MappedTreatment[];
  nextCursor?: string;
  totalCount: number;
}> {
  const url = pageParam
    ? `/api/treatments?cursor=${encodeURIComponent(pageParam)}`
    : `/api/treatments`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch treatments from Square");
  }

  return res.json();
}

export const treatmentsInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: ["treatments-infinite"],
    queryFn: ({ pageParam }) =>
      fetchTreatmentsPage({ pageParam: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

export function useInfiniteTreatments() {
  const query = useInfiniteQuery(treatmentsInfiniteQueryOptions());
  const treatments = query.data?.pages.flatMap((page) => page.items) || [];

  return {
    ...query,
    treatments,
  };
}

export function useLocations() {
  const { treatments, ...rest } = useInfiniteTreatments();

  const locations = useMemo(() => {
    return treatments.reduce<ClinicLocation[]>((acc, treatment) => {
      treatment.locations.forEach((loc) => {
        if (loc.id && !acc.some((existing) => existing.id === loc.id)) {
          acc.push(loc);
        }
      });
      return acc;
    }, []);
  }, [treatments]);

  return {
    locations,
    ...rest,
  };
}
