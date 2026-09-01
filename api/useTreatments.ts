import { wixClient } from "@/lib/wixClient";
import { queryOptions, useQuery } from "@tanstack/react-query";
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

// Helper to convert Wix media URI to public static CDN URL
function parseWixImageUrl(rawUri?: string): string | undefined {
  if (!rawUri) return undefined;
  if (rawUri.startsWith("http://") || rawUri.startsWith("https://")) {
    return rawUri;
  }
  try {
    // Generates a proper https://static.wixstatic.com/media/... URL
    const resolved = media.getImageUrl(rawUri);
    return resolved.url;
  } catch {
    // Regex fallback if SDK helper fails
    const match = rawUri.match(/v1\/([^/~#]+)/);
    if (match && match[1]) {
      return `https://static.wixstatic.com/media/${match[1]}`;
    }
    return undefined;
  }
}

export async function fetchWixTreatments(): Promise<MappedTreatment[]> {
  const { items = [] } = await wixClient.services.queryServices().find();

  return items
    .filter((s: any) => !s.hidden && s.onlineBooking?.enabled !== false)
    .map((service: any) => {
      const priceVal = service.payment?.fixed?.price?.value || "0";
      const depositVal = service.payment?.fixed?.deposit?.value;
      const priceNum = parseFloat(priceVal) || 0;
      const isFree = priceNum === 0;

      // Extract raw image URI from media payload
      const rawImageUri =
        service.media?.mainMedia?.image ||
        service.media?.items?.[0]?.image ||
        undefined;

      const imageUrl = parseWixImageUrl(rawImageUri);

      const rawLocations = service.locations || [];
      const locations: ClinicLocation[] = rawLocations.map((loc: any) => {
        const id = loc._id || loc.business?._id || "";
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
        time: "45 min",
        price: isFree ? "Free" : `£${priceNum}`,
        priceNum,
        deposit: depositVal ? `£${depositVal}` : undefined,
        imageUrl,
        locationIds: locations.map((l) => l.id),
        locations,
        featured: isFree,
      };
    });
}

export const treatmentsQueryOptions = () =>
  queryOptions({
    queryKey: ["treatments"],
    queryFn: fetchWixTreatments,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

export function useTreatments() {
  return useQuery(treatmentsQueryOptions());
}

export function useLocations() {
  const { data: treatments = [], ...rest } = useTreatments();

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
