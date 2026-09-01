"use client";

import { FormattedSlot, useAvailability } from "@/api/useAvailability";
import { useState } from "react";

export default function BookTimePage() {
  // Grab your service ID from cart or query params
  const serviceId = "0107867b-750c-47f4-b699-6e59800c0d28";

  const [selectedLocation, setSelectedLocation] = useState<
    string | undefined
  >();
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-01");

  const {
    slotsByDate,
    availableLocations,
    isLoading,
    isRedirecting,
    bookAndCheckout,
  } = useAvailability({
    serviceIds: [serviceId],
    locationId: selectedLocation,
  });

  const availableDates = Object.keys(slotsByDate);
  const timeSlots = slotsByDate[selectedDate] || [];

  const handleSlotClick = async (slot: FormattedSlot) => {
    try {
      await bookAndCheckout(slot);
    } catch (e) {
      alert("Unable to redirect to checkout. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Select Date & Time</h1>

      {/* Location Filter */}
      {availableLocations.length > 1 && (
        <div className="flex gap-2">
          {availableLocations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                selectedLocation === loc.id
                  ? "bg-[#B8925D] text-white"
                  : "bg-white"
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {/* Date Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {availableDates.map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-4 py-2 rounded-xl border shrink-0 text-sm font-medium ${
              selectedDate === date ? "bg-[#B8925D] text-white" : "bg-white"
            }`}
          >
            {date}
          </button>
        ))}
      </div>

      {/* Slots Grid */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading slots...</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              disabled={isRedirecting}
              onClick={() => handleSlotClick(slot)}
              className="p-3 border rounded-xl bg-white hover:border-[#B8925D] transition text-sm font-semibold flex flex-col items-center gap-1"
            >
              <span>{slot.timeString}</span>
              <span className="text-[11px] text-gray-500 font-normal">
                {slot.resourceName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
