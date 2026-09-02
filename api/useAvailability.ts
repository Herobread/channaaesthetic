"use client";

import { wixClient } from "@/lib/wixClient";
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
  rawEntry: any;
}

interface UseAvailabilityOptions {
  serviceIds: string[];
  startDate?: Date;
  endDate?: Date;
  locationId?: string;
}

export function useAvailability({
  serviceIds,
  startDate,
  endDate,
  locationId,
}: UseAvailabilityOptions) {
  const [rawEntries, setRawEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const serviceIdsKey = serviceIds.filter(Boolean).sort().join(",");

  const startIso = useMemo(() => {
    return (startDate || new Date()).toISOString();
  }, [startDate?.getTime()]);

  const endIso = useMemo(() => {
    if (endDate) return endDate.toISOString();
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString();
  }, [endDate?.getTime()]);

  // 1. Query availability entries
  const fetchAvailability = useCallback(async () => {
    const ids = serviceIdsKey ? serviceIdsKey.split(",") : [];
    if (!ids.length) {
      setRawEntries([]);
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
        },
      });

      setRawEntries(response.availabilityEntries || []);
    } catch (err: any) {
      console.error("Failed to fetch Wix availability:", err);
      setError(err?.message || "Failed to load slots");
    } finally {
      setIsLoading(false);
    }
  }, [serviceIdsKey, startIso, endIso]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // 2. Format slots for the UI
  const formattedSlots = useMemo<FormattedSlot[]>(() => {
    return rawEntries
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
          rawEntry: entry,
        };
      });
  }, [rawEntries]);

  // 3. Extract clinic locations
  const availableLocations = useMemo(() => {
    const locs = new Map<string, string>();
    formattedSlots.forEach((s) => {
      if (s.locationId) locs.set(s.locationId, s.locationName);
    });
    return Array.from(locs.entries()).map(([id, name]) => ({ id, name }));
  }, [formattedSlots]);

  // 4. Group by date with client-side location filter
  const slotsByDate = useMemo(() => {
    const map: Record<string, FormattedSlot[]> = {};

    for (const slot of formattedSlots) {
      if (locationId && slot.locationId !== locationId) continue;
      if (!map[slot.dateKey]) map[slot.dateKey] = [];
      map[slot.dateKey].push(slot);
    }

    return map;
  }, [formattedSlots, locationId]);

  // 5. Official Wix Headless Redirect
  async function bookAndCheckout(
    slot: FormattedSlot,
    returnPath: string = "/booking-success",
  ) {
    try {
      setIsRedirecting(true);
      const raw = slot.rawSlot;

      // 1. Build the exact slot payload the Wix backend demands
      const slotPayload: any = {
        serviceId: raw.serviceId,
        scheduleId: raw.scheduleId,
        startDate: raw.startDate,
        endDate: raw.endDate,
        timezone:
          raw.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      if (raw.resource) {
        slotPayload.resource = { id: raw.resource._id || raw.resource.id };
      }
      if (raw.location) {
        slotPayload.location = {
          id: raw.location._id || raw.location.id,
          locationType: raw.location.locationType || "OWNER_BUSINESS",
        };
      }

      // 2. Create the booking and EXPLICITLY demand an online payment session
      const bookingRes = await wixClient.bookings.createBooking({
        bookedEntity: { slot: slotPayload },
        // Hardcoded for immediate testing - you can connect your form state here later
        contactDetails: {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          phone: "+447123456789",
        },
        selectedPaymentOption: "ONLINE", // <-- THE MAGIC KEY
        numberOfParticipants: 1,
      } as any);

      console.log("Raw Wix Booking:", bookingRes.booking);

      // 3. Extract the generated Checkout ID
      const checkoutId =
        (bookingRes.booking as any)?.paymentDetails?.checkoutId ||
        (bookingRes.booking as any)?.checkoutId;

      if (!checkoutId) {
        console.error(
          "Missing Checkout ID. Full response:",
          bookingRes.booking,
        );
        throw new Error(
          "Booking created, but Wix didn't return a checkout session.",
        );
      }

      // 4. Redirect straight to the Wix eCom Payment Gateway (Bypasses the buggy form)
      const { redirectSession } =
        await wixClient.redirects.createRedirectSession({
          callbacks: {
            postFlowUrl: `${window.location.origin}${returnPath}`,
          },
          ecomCheckout: { checkoutId },
        });

      if (redirectSession?.fullUrl) {
        window.location.href = redirectSession.fullUrl;
        return;
      }

      throw new Error("No payment redirect URL returned.");
    } catch (err: any) {
      console.error("Direct booking error:", err);
      setIsRedirecting(false);
      throw err;
    }
  }

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
