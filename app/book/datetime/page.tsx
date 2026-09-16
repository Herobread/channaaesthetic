"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import BackLink from "@/components/ui/BackLink";
import { useCart } from "@/hooks/useCart";
import { useAppStore } from "@/store/useAppStore";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import { AlertCircle, Calendar, Clock, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function DateTimePickerPage() {
  const { cart, totalMinutes } = useCart();

  const selectedLocationId = useAppStore((state) => state.selectedLocationId);
  const { locations, isLoading: locationsLoading } = useClinicLocations();

  const { selectedSlot, setSelectedSlot, setLocationAddress, setDuration } =
    useBookingFlowStore();

  const [slots, setSlots] = useState<{ start: string; formatted: string }[]>(
    [],
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const activeLocation = useMemo(() => {
    if (!locations || locations.length === 0) return null;
    return locations.find((l) => l.id === selectedLocationId) || locations[0];
  }, [locations, selectedLocationId]);

  useEffect(() => {
    if (activeLocation?.address || activeLocation?.name) {
      setLocationAddress(activeLocation.address || activeLocation.name);
    }
    setDuration(totalMinutes);
  }, [activeLocation, totalMinutes, setLocationAddress, setDuration]);

  // Fetch slots from Square
  useEffect(() => {
    const locId = activeLocation?.id;
    if (!locId || cart.length === 0) return;

    async function fetchAvailability() {
      setLoadingSlots(true);
      setSlotError(null);

      const serviceVariationIds = cart
        .map((c) => c.treatment.variationId || c.treatment.id)
        .filter(Boolean);

      try {
        const res = await fetch("/api/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId: locId,
            serviceVariationIds,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load slots");

        const rawSlots = json.slots || [];
        const formatted = rawSlots.map((slot: { start: string }) => ({
          start: slot.start,
          formatted: new Date(slot.start).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setSlots(formatted);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch availability";
        setSlotError(message);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [activeLocation?.id, cart]);

  // Group slots by date
  const groupedDays = useMemo(() => {
    const map: Record<
      string,
      {
        dayKey: string;
        date: Date;
        weekday: string;
        dayNum: string;
        month: string;
        slots: { start: string; formatted: string }[];
      }
    > = {};

    slots.forEach((slot) => {
      const d = new Date(slot.start);
      const dayKey = slot.start.split("T")[0];

      if (!map[dayKey]) {
        map[dayKey] = {
          dayKey,
          date: d,
          weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
          dayNum: d.toLocaleDateString("en-GB", { day: "numeric" }),
          month: d.toLocaleDateString("en-GB", { month: "short" }),
          slots: [],
        };
      }
      map[dayKey].slots.push(slot);
    });

    return Object.values(map);
  }, [slots]);

  useEffect(() => {
    if (groupedDays.length > 0 && !selectedDayKey) {
      setSelectedDayKey(groupedDays[0].dayKey);
    }
  }, [groupedDays, selectedDayKey]);

  const activeDay = useMemo(() => {
    return groupedDays.find((g) => g.dayKey === selectedDayKey) || null;
  }, [groupedDays, selectedDayKey]);

  const currentDaySlots = useMemo(() => {
    return activeDay?.slots || [];
  }, [activeDay]);

  return (
    <>
      <BackLink href={"/book"}>Back to treatments</BackLink>

      <header className="mt-4 mb-8 lg:mb-10">
        <h1 className="font-serif text-headline font-normal text-text-primary tracking-tight">
          Select date &amp; time
        </h1>
        <p className="text-caption font-sans text-text-muted mt-1.5">
          Choose an available slot for your consultation &amp; procedure.
        </p>
      </header>

      {slotError && (
        <div className="flex items-center gap-2.5 p-4 mb-6 bg-surface-elevated border border-red-200 rounded-card text-caption font-sans text-red-800 shadow-subtle">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{slotError}</span>
        </div>
      )}

      {loadingSlots || locationsLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-text-muted gap-3 rounded-card border border-border-subtle bg-surface-elevated shadow-subtle">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span className="text-caption font-sans">Finding open times...</span>
        </div>
      ) : groupedDays.length === 0 ? (
        <div className="py-20 text-center rounded-card border border-border-subtle bg-surface-elevated p-8 text-caption font-sans text-text-muted shadow-subtle">
          No openings found in the next 10 days.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Date Selection Column */}
          <section className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="inline-flex items-center gap-2 text-caption font-sans font-medium text-text-primary">
                <Calendar className="w-4 h-4 text-accent" /> Select date
              </span>
              <span className="text-caption font-sans text-text-muted hidden lg:inline">
                {groupedDays.length} dates available
              </span>
            </div>

            {/* Mobile: Horizontal scroll | Desktop: Clean vertical sequence */}
            <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none -mx-1 px-1 lg:mx-0 lg:px-0">
              {groupedDays.map((day) => {
                const isSelected = selectedDayKey === day.dayKey;
                return (
                  <button
                    key={day.dayKey}
                    type="button"
                    onClick={() => {
                      setSelectedDayKey(day.dayKey);
                      setSelectedSlot(null);
                    }}
                    className={`shrink-0 flex items-center transition-all cursor-pointer focus-ring text-left w-18 py-3 flex-col justify-center rounded-control lg:w-full lg:flex-row lg:justify-between lg:px-4 lg:py-3.5 ${
                      isSelected
                        ? "bg-surface-dark text-text-inverted border border-surface-dark shadow-subtle"
                        : "bg-surface-elevated border border-border-subtle text-text-primary hover:border-border-focus"
                    }`}
                  >
                    {/* Mobile layout */}
                    <span
                      className={`lg:hidden text-caption font-sans ${
                        isSelected ? "text-text-inverted/90" : "text-text-muted"
                      }`}
                    >
                      {day.weekday}
                    </span>
                    <span className="lg:hidden text-body font-sans font-medium my-0.5">
                      {day.dayNum}
                    </span>
                    <span
                      className={`lg:hidden text-caption font-sans font-medium ${
                        isSelected ? "text-accent-champagne" : "text-text-muted"
                      }`}
                    >
                      {day.month}
                    </span>

                    {/* Desktop layout row */}
                    <div className="hidden lg:flex items-baseline gap-2.5">
                      <span className="text-body font-sans font-medium">
                        {day.weekday}, {day.dayNum} {day.month}
                      </span>
                    </div>
                    <span
                      className={`hidden lg:inline text-caption font-sans ${
                        isSelected
                          ? "text-accent-champagne font-medium"
                          : "text-text-muted"
                      }`}
                    >
                      {day.slots.length} slots
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Time Slot Column */}
          <section className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="inline-flex items-center gap-2 text-caption font-sans font-medium text-text-primary">
                <Clock className="w-4 h-4 text-accent" /> Available times
              </span>
              {activeDay && (
                <span className="text-caption font-sans text-text-muted">
                  {activeDay.weekday}, {activeDay.dayNum} {activeDay.month}
                </span>
              )}
            </div>

            {currentDaySlots.length === 0 ? (
              <div className="py-14 text-center border border-border-subtle rounded-control bg-surface-canvas p-6 text-caption font-sans text-text-muted">
                No slots available for this date.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {currentDaySlots.map(({ start, formatted }) => {
                  const isSelected = selectedSlot === start;
                  return (
                    <button
                      key={start}
                      type="button"
                      onClick={() => setSelectedSlot(start)}
                      className={`py-3 px-3 rounded-control text-caption font-sans font-medium border transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-accent text-text-inverted border-accent shadow-accent-glow focus-ring-accent"
                          : "bg-surface-elevated border-border-subtle text-text-primary hover:border-border-focus focus-ring"
                      }`}
                    >
                      {formatted}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
