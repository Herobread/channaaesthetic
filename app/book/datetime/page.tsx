"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import NavBarLogoOnly from "@/components/ui/NavBarLogoOnly";
import { useCart } from "@/hooks/useCart";
import { useAppStore } from "@/store/useAppStore";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import { AlertCircle, ArrowLeft, Clock, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CAL_ALLOWED_DURATIONS = [15, 30, 45, 60, 75, 90, 120, 180];

function snapToCalDuration(minutes: number): number {
  if (minutes <= 0) return 30;
  const match = CAL_ALLOWED_DURATIONS.find((d) => d >= minutes);
  return match || 180;
}

export default function DateTimePickerPage() {
  const { cart, totalPrice, totalDeposit } = useCart();

  // FIX: Read selectedLocationId directly from persisted useAppStore
  const selectedLocationId = useAppStore((state) => state.selectedLocationId);
  const { locations, isLoading: locationsLoading } = useClinicLocations();

  const {
    selectedSlot,
    setSelectedSlot,
    setEventTypeId,
    setLocationAddress,
    setDuration,
  } = useBookingFlowStore();

  const [slots, setSlots] = useState<{ start: string; formatted: string }[]>(
    [],
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Resolves the exact active clinic chosen on Step 1
  const activeLocation = useMemo(() => {
    if (!locations || locations.length === 0) return null;
    return (
      locations.find((loc) => loc.id === selectedLocationId) || locations[0]
    );
  }, [locations, selectedLocationId]);

  const eventTypeId = activeLocation?.calEventTypeId;

  const totalDuration = useMemo(() => {
    const rawMins = cart.reduce((acc, item) => {
      const parsed = item.treatment.durationMinutes || 30;
      return acc + parsed * item.quantity;
    }, 0);
    return snapToCalDuration(rawMins);
  }, [cart]);

  // Synchronize the resolved eventTypeId & duration into the booking store
  useEffect(() => {
    if (activeLocation?.calEventTypeId) {
      setEventTypeId(activeLocation.calEventTypeId);
    }
    if (activeLocation?.address || activeLocation?.name) {
      setLocationAddress(activeLocation.address || activeLocation.name);
    }
    setDuration(totalDuration);
  }, [
    activeLocation,
    totalDuration,
    setEventTypeId,
    setLocationAddress,
    setDuration,
  ]);

  useEffect(() => {
    if (!eventTypeId) return;

    async function fetchAvailability() {
      setLoadingSlots(true);
      setSlotError(null);

      const today = new Date();
      const nextWeek = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      const params = new URLSearchParams({
        eventTypeId: eventTypeId.toString(),
        start: today.toISOString().split("T")[0],
        end: nextWeek.toISOString().split("T")[0],
        timeZone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
        duration: totalDuration.toString(),
      });

      try {
        const res = await fetch(`/api/slots?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load slots");

        const raw = json.data?.slots || json.data || {};
        const flattened = Array.isArray(raw) ? raw : Object.values(raw).flat();

        const formatted = flattened.map((slot: any) => {
          const iso = typeof slot === "string" ? slot : slot.start || slot.time;
          return {
            start: iso,
            formatted: new Date(iso).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });

        setSlots(formatted);
      } catch (err: any) {
        setSlotError(err.message || "Failed to fetch availability");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [eventTypeId, totalDuration]);

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

  const currentDaySlots = useMemo(() => {
    if (!selectedDayKey) return [];
    return groupedDays.find((g) => g.dayKey === selectedDayKey)?.slots || [];
  }, [groupedDays, selectedDayKey]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B8925D]/20 selection:text-[#B8925D]">
      <NavBarLogoOnly theme="dark" />

      <main className="max-w-xl mx-auto px-4 pt-20 pb-36 space-y-5">
        <Link
          href="/book"
          className="inline-flex items-center text-xs text-[#8C827A] gap-1 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Treatments
        </Link>

        {/* Clinical Context Header */}
        <div className="bg-white border border-[#EBE5DF] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A] truncate">
              <MapPin className="w-3.5 h-3.5 text-[#B8925D] shrink-0" />
              <span className="truncate">
                {activeLocation?.name || "Clinic"}
              </span>
            </div>
            <p className="text-[11px] text-[#8C827A] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#B8925D]" />
              {totalDuration}m appointment window
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-[#1A1A1A]">
              £{totalPrice}
            </span>
            <p className="text-[10px] text-[#B8925D] font-medium">
              (£{totalDeposit} deposit)
            </p>
          </div>
        </div>

        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-medium text-[#1A1A1A]">
            Select Date &amp; Time
          </h1>
          <p className="text-xs text-[#8C827A] mt-1">
            Choose an available slot for your consultation &amp; procedure.
          </p>
        </div>

        {slotError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{slotError}</span>
          </div>
        )}

        {loadingSlots || locationsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#8C827A] gap-2.5 bg-white rounded-2xl border border-[#EBE5DF]">
            <Loader2 className="w-5 h-5 animate-spin text-[#B8925D]" />
            <span className="text-xs">Finding available times...</span>
          </div>
        ) : groupedDays.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-2xl border border-[#EBE5DF] p-6 text-xs text-[#8C827A]">
            No openings found in the next 10 days for this duration.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Horizontal Day Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
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
                    className={`shrink-0 flex flex-col items-center justify-center w-16 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-white border-[#EBE5DF] text-[#1A1A1A] hover:border-[#1A1A1A]"
                    }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-medium ${
                        isSelected ? "text-neutral-400" : "text-[#8C827A]"
                      }`}
                    >
                      {day.weekday}
                    </span>
                    <span className="text-base font-semibold my-0.5">
                      {day.dayNum}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-medium ${
                        isSelected ? "text-[#B8925D]" : "text-[#8C827A]"
                      }`}
                    >
                      {day.month}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {currentDaySlots.map(({ start, formatted }) => {
                const isSelected = selectedSlot === start;
                return (
                  <button
                    key={start}
                    type="button"
                    onClick={() => setSelectedSlot(start)}
                    className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#B8925D] text-white border-[#B8925D] shadow-sm"
                        : "bg-white border-[#EBE5DF] text-[#1A1A1A] hover:border-black"
                    }`}
                  >
                    {formatted}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
