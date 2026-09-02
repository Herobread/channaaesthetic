"use client";

import { FormattedSlot, useAvailability } from "@/api/useAvailability";
import NavBarLogoOnly from "@/components/ui/NavBarLogoOnly";
import { useCartStore } from "@/hooks/useCart";
import { useAppStore } from "@/store/useAppStore";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function BookTimePage() {
  const router = useRouter();

  const { cart, totalPrice } = useCartStore();
  const selectedLocationId = useAppStore((state) => state.selectedLocationId);

  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<FormattedSlot | null>(null);

  const primaryServiceId = cart[0]?.treatment.id;

  const { slotsByDate, isLoading, isRedirecting, bookAndCheckout } =
    useAvailability({
      serviceIds: primaryServiceId ? [primaryServiceId] : [],
      locationId: selectedLocationId || undefined,
    });

  const availableDates = useMemo(
    () => Object.keys(slotsByDate).sort(),
    [slotsByDate],
  );
  const timeSlots = selectedDateKey ? slotsByDate[selectedDateKey] || [] : [];

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDateKey) {
      setSelectedDateKey(availableDates[0]);
    }
  }, [availableDates, selectedDateKey]);

  const handleDateChange = (dateStr: string) => {
    setSelectedDateKey(dateStr);
    setSelectedSlot(null);
  };

  useEffect(() => {
    if (cart.length === 0) router.replace("/book");
  }, [cart, router]);

  const totalDeposit = useMemo(() => {
    return cart.reduce((acc, curr) => {
      const depVal = curr.treatment.deposit
        ? parseFloat(curr.treatment.deposit.replace(/[^0-9.]/g, "")) || 0
        : 0;
      return acc + depVal * curr.quantity;
    }, 0);
  }, [cart]);

  if (cart.length === 0) return null;

  const handleProceed = async () => {
    if (!selectedSlot) return;
    try {
      await bookAndCheckout(selectedSlot);
    } catch (e: any) {
      alert(
        e?.message ||
          "Failed to process booking. Please ensure your Wix site checkout is enabled.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased">
      <NavBarLogoOnly theme="dark" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-32">
        <Link
          href="/book"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C827A] hover:text-[#1A1A1A] transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Treatments
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Calendar Selection */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="font-serif text-3xl font-medium text-[#1A1A1A]">
                Select a Date & Time
              </h1>
              <p className="text-sm text-[#666666] mt-2">
                All selected treatments will be completed in this single visit.
              </p>
            </div>

            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-[#8C827A] gap-3 bg-white rounded-3xl border border-[#EBE5DF]">
                <Loader2 className="w-6 h-6 animate-spin text-[#B8925D]" />
                <span className="text-xs font-medium tracking-wide">
                  Finding available appointments...
                </span>
              </div>
            ) : availableDates.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-[#EBE5DF] p-8">
                <CalendarIcon className="w-8 h-8 text-[#8C827A] mx-auto mb-3 opacity-50" />
                <p className="font-medium text-[#1A1A1A]">
                  No appointments available
                </p>
                <p className="text-xs text-[#8C827A] mt-1">
                  Try switching your location or checking back later.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C827A]">
                      {new Date(selectedDateKey).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar mask-fade-right">
                    {availableDates.map((dateStr) => {
                      const dateObj = new Date(dateStr);
                      const dayName = dateObj.toLocaleDateString("en-GB", {
                        weekday: "short",
                      });
                      const dayNum = dateObj.toLocaleDateString("en-GB", {
                        day: "numeric",
                      });
                      const isSelected = selectedDateKey === dateStr;

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleDateChange(dateStr)}
                          className={`snap-start shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#B8925D] border-[#B8925D] text-white shadow-md shadow-[#B8925D]/20"
                              : "bg-white border-[#EBE5DF] text-[#1A1A1A] hover:border-[#DFC095]"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wider ${
                              isSelected ? "text-white/90" : "text-[#8C827A]"
                            }`}
                          >
                            {dayName}
                          </span>
                          <span className="text-xl font-medium font-serif">
                            {dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C827A]">
                    Available Times
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {timeSlots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`group relative p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? "border-[#B8925D] bg-[#B8925D]/10 ring-2 ring-[#B8925D] shadow-sm"
                              : "border-[#EBE5DF] bg-white hover:border-[#B8925D] hover:shadow-xs"
                          }`}
                        >
                          <span
                            className={`text-sm font-semibold transition-colors ${
                              isSelected
                                ? "text-[#B8925D]"
                                : "text-[#1A1A1A] group-hover:text-[#B8925D]"
                            }`}
                          >
                            {slot.timeString}
                          </span>
                          <span className="text-[10px] text-[#8C827A] font-medium">
                            {slot.resourceName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Order Summary */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-8 bg-white/60 backdrop-blur-2xl rounded-3xl border border-[#EBE5DF] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-6 bg-white/50 border-b border-[#EBE5DF]">
                <h2 className="font-serif text-xl font-medium text-[#1A1A1A]">
                  Your Appointment
                </h2>
                {selectedSlot ? (
                  <p className="flex items-center gap-1.5 text-xs text-[#8C827A] mt-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#B8925D]" />
                    <span>{selectedSlot.locationName}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {new Date(selectedSlot.startDate).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short" },
                      )}{" "}
                      at {selectedSlot.timeString}
                    </span>
                  </p>
                ) : timeSlots[0]?.locationName ? (
                  <p className="flex items-center gap-1.5 text-xs text-[#8C827A] mt-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#B8925D]" />
                    {timeSlots[0].locationName}
                  </p>
                ) : null}
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {cart.map(({ treatment, quantity }) => (
                    <div
                      key={treatment.id}
                      className="flex justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">
                          {quantity > 1 ? `${quantity}x ` : ""}
                          {treatment.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#8C827A] mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#B8925D]" />{" "}
                            {treatment.time}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[#1A1A1A] shrink-0">
                        {treatment.price}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#EBE5DF]/80 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8C827A]">Total</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      £{totalPrice}
                    </span>
                  </div>
                  {totalDeposit > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8C827A]">
                        Deposit required today
                      </span>
                      <span className="font-semibold text-[#B8925D]">
                        £{totalDeposit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  type="button"
                  disabled={!selectedSlot || isRedirecting}
                  onClick={handleProceed}
                  className={`w-full h-12 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
                    selectedSlot && !isRedirecting
                      ? "bg-[#B8925D] hover:bg-[#9E7B4C] text-white cursor-pointer shadow-md shadow-[#B8925D]/20 active:scale-[0.99]"
                      : "bg-[#FAFAF8] border border-[#EBE5DF] text-[#8C827A] cursor-not-allowed opacity-80"
                  }`}
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Redirecting...</span>
                    </>
                  ) : selectedSlot ? (
                    <>
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <span>Select a time slot to continue</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade-right { mask-image: linear-gradient(to right, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%); }
      `,
        }}
      />
    </div>
  );
}
