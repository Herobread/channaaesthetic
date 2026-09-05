// app/book/datetime/page.tsx
"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function DateTimePickerPage() {
  const router = useRouter();
  const { cart, clearCart, totalPrice } = useCart();
  const {
    locations,
    selectedLocationId,
    isLoading: locationsLoading,
  } = useClinicLocations();

  const [slots, setSlots] = useState<{ start: string; formatted: string }[]>(
    [],
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLocation = useMemo(() => {
    return (
      locations.find((loc) => loc.id === selectedLocationId) || locations[0]
    );
  }, [locations, selectedLocationId]);

  const eventTypeId = activeLocation?.calEventTypeId;

  // Aggregate cart duration
  const totalDuration = useMemo(() => {
    const mins = cart.reduce((acc, item) => {
      const parsed = parseInt(item.treatment.time.replace(/[^0-9]/g, ""), 10);
      return acc + (isNaN(parsed) ? 45 : parsed) * item.quantity;
    }, 0);
    return mins > 0 ? mins : 45;
  }, [cart]);

  // Aggregate deposit
  const totalDeposit = useMemo(() => {
    const calculated = cart.reduce((acc, item) => {
      if (!item.treatment.deposit) return acc;
      const num = parseInt(item.treatment.deposit.replace(/[^0-9]/g, ""), 10);
      return acc + (isNaN(num) ? 0 : num * item.quantity);
    }, 0);
    return calculated > 0 ? calculated : 50;
  }, [cart]);

  // Fetch slots
  useEffect(() => {
    if (!eventTypeId) return;

    async function fetchAvailability() {
      setLoadingSlots(true);
      setSlotError(null);
      setSelectedSlot(null);

      const today = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

        setSlots(
          flattened.map((slot: any) => {
            const iso =
              typeof slot === "string" ? slot : slot.start || slot.time;
            return {
              start: iso,
              formatted: new Date(iso).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          }),
        );
      } catch (err: any) {
        setSlotError(err.message);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [eventTypeId, totalDuration]);

  // Group slots by day
  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, typeof slots>>((acc, slot) => {
      const day = new Date(slot.start).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    }, {});
  }, [slots]);

  // Book slot
  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !eventTypeId || !name || !email) return;

    setIsSubmitting(true);
    setSlotError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: selectedSlot,
          eventTypeId,
          duration: totalDuration,
          locationAddress: activeLocation?.address || activeLocation?.name,
          name,
          email,
          phoneNumber: phone,
          cart, // <--- sends the cart array
          totalPrice, // <--- from useCart()
          totalDeposit, // <--- calculated deposit
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setConfirmedSlot(selectedSlot);
      clearCart();
    } catch (err: any) {
      setSlotError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (locationsLoading)
    return <div style={{ padding: 20 }}>Loading clinic...</div>;

  if (confirmedSlot) {
    return (
      <div
        style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}
      >
        <h2>Appointment Reserved</h2>
        <p>
          Booked for:{" "}
          <strong>{new Date(confirmedSlot).toLocaleString("en-GB")}</strong>
        </p>
        <p>Location: {activeLocation?.name}</p>
        <button onClick={() => router.push("/book")}>Back to Treatments</button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "20px auto",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Link href="/book">← Back</Link>

      <div>
        <h2>Select Date & Time</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          Location: {activeLocation?.name} | Duration: {totalDuration}m |
          Deposit: £{totalDeposit}
        </p>
      </div>

      {slotError && (
        <div style={{ color: "red", fontSize: 14 }}>{slotError}</div>
      )}
      {loadingSlots && <div>Loading available slots...</div>}

      {!loadingSlots && slots.length === 0 && (
        <div>No open slots available.</div>
      )}

      <div>
        {Object.entries(groupedSlots).map(([day, daySlots]) => (
          <div key={day} style={{ marginBottom: 16 }}>
            <strong>{day}</strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 6,
              }}
            >
              {daySlots.map(({ start, formatted }) => (
                <button
                  key={start}
                  type="button"
                  onClick={() => setSelectedSlot(start)}
                  style={{
                    padding: "8px 12px",
                    background: selectedSlot === start ? "#000" : "#fff",
                    color: selectedSlot === start ? "#fff" : "#000",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  {formatted}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedSlot && (
        <form
          onSubmit={handleBooking}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: "1px solid #ccc",
            paddingTop: 16,
          }}
        >
          <h3>Patient Information</h3>
          <input
            type="text"
            required
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            type="email"
            required
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: 8 }}
          />

          <button
            type="submit"
            disabled={isSubmitting || !name || !email}
            style={{
              padding: "12px",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isSubmitting
              ? "Booking..."
              : `Confirm Booking & Pay £${totalDeposit}`}
          </button>
        </form>
      )}
    </div>
  );
}
