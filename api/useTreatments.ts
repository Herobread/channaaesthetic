import { wixClient } from "@/lib/wixClient";
import { queryOptions, useQuery } from "@tanstack/react-query";

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
  locationIds: string[];
  locations: ClinicLocation[];
  featured?: boolean;
}

// 1. Pure Fetcher
export async function fetchWixTreatments(): Promise<MappedTreatment[]> {
  const { items = [] } = await wixClient.services.queryServices().find();

  return items
    .filter((s: any) => !s.hidden && s.onlineBooking?.enabled !== false)
    .map((service: any) => {
      const priceVal = service.payment?.fixed?.price?.value || "0";
      const depositVal = service.payment?.fixed?.deposit?.value;
      const priceNum = parseFloat(priceVal) || 0;
      const isFree = priceNum === 0;

      // Map dynamic locations from Wix
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
        desc:
          service.description ||
          service.tagLine ||
          "Bespoke clinical treatment.",
        category: service.category?.name || "Other",
        time: "45 min",
        price: isFree ? "Free" : `£${priceNum}`,
        priceNum,
        deposit: depositVal ? `£${depositVal}` : undefined,
        locationIds: locations.map((l) => l.id),
        locations,
        featured: isFree,
      };
    });
}

// 2. Query Options
export const treatmentsQueryOptions = () =>
  queryOptions({
    queryKey: ["treatments"],
    queryFn: fetchWixTreatments,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

// 3. Treatments Hook
export function useTreatments() {
  return useQuery(treatmentsQueryOptions());
}

// 4. Dynamic Locations Hook (derives unique locations from the cached treatments)
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
