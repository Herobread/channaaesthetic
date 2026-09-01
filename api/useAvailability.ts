"use client";

import { wixClient } from "@/lib/wixClient";
import { checkout } from "@wix/ecom";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface FormattedSlot {
  id: string;
  startDate: string;
  endDate: string;
  timeString: string;
  dateKey: string;
  resourceName: string;
  resourceId?: string;
  locationName: string;
  locationId?: string;
  rawSlot: any;
}

interface UseAvailabilityOptions {
  serviceIds: string[];
  startDate?: Date;
  endDate?: Date;
  locationId?: string;
  resourceId?: string;
}

export function useAvailability({
  serviceIds,
  startDate,
  endDate,
  locationId,
  resourceId,
}: UseAvailabilityOptions) {
  const [rawSlots, setRawSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Stabilize array reference with a string key
  const serviceIdsKey = serviceIds.filter(Boolean).sort().join(",");

  // 2. Stabilize ISO date strings so they don't regenerate every render
  const startIso = useMemo(() => {
    return (startDate || new Date()).toISOString();
  }, [startDate?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const endIso = useMemo(() => {
    if (endDate) return endDate.toISOString();
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString();
  }, [endDate?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Fetch availability using primitive string dependencies
  const fetchAvailability = useCallback(async () => {
    const ids = serviceIdsKey ? serviceIdsKey.split(",") : [];
    if (!ids.length) {
      setRawSlots([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await wixClient.availabilityCalendar.queryAvailability({
        filter: {
          serviceId: ids,
          startDate: startIso,
          endDate: endIso,
          ...(locationId ? { locationId: [locationId] } : {}),
          ...(resourceId ? { resourceId: [resourceId] } : {}),
        },
      });

      setRawSlots(response.availabilityEntries || []);
    } catch (err: any) {
      console.error("Failed to fetch Wix availability:", err);
      setError(err?.message || "Failed to load slots");
    } finally {
      setIsLoading(false);
    }
  }, [serviceIdsKey, startIso, endIso, locationId, resourceId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // 4. Format and organize slots
  const formattedSlots = useMemo<FormattedSlot[]>(() => {
    return rawSlots
      .filter((entry) => entry.bookable)
      .map((entry) => {
        const slot = entry.slot;
        const startD = new Date(slot.startDate);

        const dateKey = startD.toISOString().split("T")[0];
        const timeString = startD.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        return {
          id: `${slot.serviceId}-${slot.startDate}-${slot.location?._id || ""}`,
          startDate: slot.startDate,
          endDate: slot.endDate,
          timeString,
          dateKey,
          resourceName: slot.resource?.name || "Staff",
          resourceId: slot.resource?._id,
          locationName: slot.location?.name || "Clinic",
          locationId: slot.location?._id,
          rawSlot: slot,
        };
      });
  }, [rawSlots]);

  // 5. Group slots by date string: { "2026-09-01": [Slot, Slot] }
  const slotsByDate = useMemo(() => {
    const map: Record<string, FormattedSlot[]> = {};
    for (const slot of formattedSlots) {
      if (!map[slot.dateKey]) map[slot.dateKey] = [];
      map[slot.dateKey].push(slot);
    }
    return map;
  }, [formattedSlots]);

  // 6. Extract unique locations
  const availableLocations = useMemo(() => {
    const locs = new Map<string, string>();
    formattedSlots.forEach((s) => {
      if (s.locationId) locs.set(s.locationId, s.locationName);
    });
    return Array.from(locs.entries()).map(([id, name]) => ({ id, name }));
  }, [formattedSlots]);

  // 7. Checkout redirect handler
  const bookAndCheckout = useCallback(
    async (slot: FormattedSlot, returnPath: string = "/booking-success") => {
      try {
        setIsRedirecting(true);

        const bookingCheckout = await wixClient.checkout.createCheckout({
          channelType: checkout.ChannelType.WEB,
          lineItems: [
            {
              catalogReference: {
                appId: "13d21c63-b5ec-4e68-bc25-24f333333333",
                catalogItemId: slot.rawSlot.serviceId,
                options: {
                  slot: slot.rawSlot,
                },
              },
              quantity: 1,
            },
          ],
        });

        const { redirectSession } =
          await wixClient.redirects.createRedirectSession({
            ecomCheckout: { checkoutId: bookingCheckout._id! },
            callbacks: {
              postFlowUrl: `${window.location.origin}${returnPath}`,
            },
          });

        if (redirectSession?.fullUrl) {
          window.location.href = redirectSession.fullUrl;
        } else {
          throw new Error("Failed to generate checkout session URL");
        }
      } catch (err: any) {
        console.error("Booking error:", err);
        setIsRedirecting(false);
        throw err;
      }
    },
    [],
  );

  return {
    slots: formattedSlots,
    slotsByDate,
    availableLocations,
    isLoading,
    isRedirecting,
    error,
    refreshSlots: fetchAvailability,
    bookAndCheckout,
  };
}
