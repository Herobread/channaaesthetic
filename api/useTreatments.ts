import { sanityClient } from "@/sanity/lib/sanityClient";
import { createImageUrlBuilder } from "@sanity/image-url";
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
  price: string;
  priceNum: number;
  deposit?: string;
  imageUrl?: string;
  locationIds: string[];
  locations: ClinicLocation[];
  featured?: boolean;
}

const imageBuilder = createImageUrlBuilder(sanityClient);

function urlFor(source: any): string | undefined {
  if (!source?.asset) return undefined;
  return imageBuilder.image(source).auto("format").fit("max").url();
}

const PAGE_SIZE = 50;

export async function fetchTreatmentsPage({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<{
  items: MappedTreatment[];
  nextCursor?: number;
  totalCount: number;
}> {
  const start = pageParam;
  const end = pageParam + PAGE_SIZE;

  const query = `{
    "totalCount": count(*[_type == "treatment"]),
    "rawItems": *[_type == "treatment"] | order(_createdAt desc) [${start}...${end}] {
      _id,
      title,
      category,
      desc,
      durationMinutes,
      priceNum,
      deposit,
      featured,
      image,
      "locations": locations[]-> {
        _id,
        name,
        city,
        address
      }
    }
  }`;

  const { totalCount, rawItems } = await sanityClient.fetch(query);

  const mappedItems: MappedTreatment[] = (rawItems || []).map((item: any) => {
    const priceNum = item.priceNum ?? 0;
    const isFree = priceNum === 0;

    // Filter out nulls just in case a location reference was deleted in Sanity
    const locations: ClinicLocation[] = (item.locations || [])
      .filter(Boolean)
      .map((loc: any) => ({
        id: loc._id || "",
        name: loc.name || "Clinic",
        city: loc.city || "",
        address: loc.address || "",
      }));

    return {
      id: item._id,
      title: item.title || "Untitled Treatment",
      desc: item.desc || "Bespoke clinical treatment.",
      category: item.category || "Other",
      time: item.durationMinutes ? `${item.durationMinutes} min` : "45 min",
      price: isFree ? "Free" : `£${priceNum}`,
      priceNum,
      deposit: item.deposit ? `£${item.deposit}` : undefined,
      imageUrl: urlFor(item.image),
      locationIds: locations.map((l) => l.id),
      locations,
      featured: item.featured ?? isFree,
    };
  });

  const nextSkip = pageParam + mappedItems.length;
  const hasMore = mappedItems.length === PAGE_SIZE && nextSkip < totalCount;

  return {
    items: mappedItems,
    nextCursor: hasMore ? nextSkip : undefined,
    totalCount,
  };
}

export const treatmentsInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: ["treatments-infinite"],
    queryFn: ({ pageParam }) =>
      fetchTreatmentsPage({ pageParam: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5,
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
