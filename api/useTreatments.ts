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
  variationId?: string; // Square catalog service variation ID
  category: string;
  title: string;
  desc: string;
  time: string;
  durationMinutes: number;
  price: number; // Raw numeric GBP (e.g., 100)
  priceNum?: number;
  deposit?: number; // Raw numeric GBP (e.g., 25 or 0)
  depositNum?: number;
  depositInPence?: number; // Integer for Square Payments API (e.g., 2500)
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

  const data = await res.json();

  // Normalize price and deposit numeric aliases so consumers don't break
  const items: MappedTreatment[] = (data.items || []).map((item: any) => {
    const rawPrice = Number(item.price) || 0;
    const rawDeposit = Number(item.deposit) || 0;

    return {
      ...item,
      price: rawPrice,
      priceNum: rawPrice,
      deposit: rawDeposit,
      depositNum: rawDeposit,
      depositInPence: Math.round(rawDeposit * 100),
    };
  });

  return {
    ...data,
    items,
  };
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
  const treatments = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) || [],
    [query.data],
  );

  return {
    ...query,
    treatments,
  };
}

export function useLocations() {
  const { treatments, ...rest } = useInfiniteTreatments();

  const locations = useMemo(() => {
    return treatments.reduce<ClinicLocation[]>((acc, treatment) => {
      (treatment.locations || []).forEach((loc) => {
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
