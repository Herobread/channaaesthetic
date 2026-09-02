import { wixClient } from "@/lib/wixClient";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { media } from "@wix/sdk";

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

function parseWixImageUrl(rawUri?: string): string | undefined {
  if (!rawUri) return undefined;
  if (rawUri.startsWith("http://") || rawUri.startsWith("https://")) {
    return rawUri;
  }
  try {
    const resolved = media.getImageUrl(rawUri);
    return resolved.url;
  } catch {
    const match = rawUri.match(/v1\/([^/~#]+)/);
    if (match && match[1]) {
      return `https://static.wixstatic.com/media/${match[1]}`;
    }
    return undefined;
  }
}

const PAGE_SIZE = 50;

export async function fetchWixTreatmentsPage({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<{
  items: MappedTreatment[];
  nextCursor?: number;
  totalCount: number;
}> {
  const result = await wixClient.services
    .queryServices()
    .skip(pageParam)
    .limit(PAGE_SIZE)
    .find();

  const totalCount =
    (result as any).totalCount || (result as any)._totalCount || 0;
  const rawItems = result.items || [];

  const mappedItems: MappedTreatment[] = rawItems
    .filter((s: any) => !s.hidden && s.onlineBooking?.enabled !== false)
    .map((service: any) => {
      const priceVal = service.payment?.fixed?.price?.value || "0";
      const depositVal = service.payment?.fixed?.deposit?.value;
      const priceNum = parseFloat(priceVal) || 0;
      const isFree = priceNum === 0;

      const rawImageUri =
        service.media?.mainMedia?.image ||
        service.media?.items?.[0]?.image ||
        undefined;

      const imageUrl = parseWixImageUrl(rawImageUri);

      const rawLocations = service.locations || [];
      const locations: ClinicLocation[] = rawLocations.map((loc: any) => {
        const id = loc._id || loc.business?._id || loc.locationId || "";
        const city =
          loc.calculatedAddress?.city || loc.business?.address?.city || "";
        const street = loc.calculatedAddress?.streetAddress?.name
          ? `${loc.calculatedAddress.streetAddress.number || ""} ${loc.calculatedAddress.streetAddress.name}`.trim()
          : loc.calculatedAddress?.formatted || "";

        const businessName = loc.business?.name || "Clinic";
        const displayName =
          city && street ? `${city} (${street})` : businessName;

        return {
          id,
          name: displayName,
          city: city || businessName,
          address: loc.calculatedAddress?.formatted || "",
        };
      });

      return {
        id: service._id || "",
        title: service.name || "Untitled Treatment",
        desc: service.description || "Bespoke clinical treatment.",
        category: service.category?.name || "Other",
        time: service.schedule?.duration
          ? `${service.schedule.duration} min`
          : "45 min",
        price: isFree ? "Free" : `£${priceNum}`,
        priceNum,
        deposit: depositVal ? `£${depositVal}` : undefined,
        imageUrl,
        locationIds: locations.map((l) => l.id),
        locations,
        featured: isFree,
      };
    });

  const nextSkip = pageParam + rawItems.length;
  const hasMore =
    rawItems.length === PAGE_SIZE && (!totalCount || nextSkip < totalCount);

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
      fetchWixTreatmentsPage({ pageParam: pageParam as number }),
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

  const locations = treatments.reduce<ClinicLocation[]>((acc, treatment) => {
    treatment.locations.forEach((loc) => {
      if (loc.id && !acc.some((existing) => existing.id === loc.id)) {
        acc.push(loc);
      }
    });
    return acc;
  }, []);

  return {
    locations,
    ...rest,
  };
}
