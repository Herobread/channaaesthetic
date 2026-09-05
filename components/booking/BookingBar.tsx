// components/BookingBar.tsx
"use client";

import { useCart } from "@/hooks/useCart";
import { useAppStore } from "@/store/useAppStore";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import {
  AlertCircle,
  ArrowRight,
  ChevronUp,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, isNaN(minutes) ? 0 : minutes);
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export default function BookingBar() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    cart,
    totalQuantity,
    totalPrice,
    totalMinutes,
    totalDeposit,
    handleDecrement,
    clearCart,
    maxMinutes = 180,
  } = useCart();

  const selectedLocationId = useAppStore((state) => state.selectedLocationId);
  const {
    selectedSlot,
    eventTypeId,
    duration,
    locationAddress,
    customerDetails,
    isSubmitting,
    setIsSubmitting,
    resetFlow,
  } = useBookingFlowStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(totalQuantity > 0);
  const [isVisible, setIsVisible] = useState(false);

  const isStep1Treatments = pathname === "/book";
  const isStep2DateTime = pathname.includes("/datetime");
  const isStep3Details = pathname.includes("/details");

  const isOverLimit = totalMinutes > maxMinutes;
  const hasPickedSlot = Boolean(selectedSlot);
  const hasFilledDetails = Boolean(
    customerDetails.name?.trim() &&
    customerDetails.email?.trim() &&
    customerDetails.phone?.trim(),
  );

  useEffect(() => {
    if (totalQuantity > 0) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 15);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
      const timer = setTimeout(() => setShouldRender(false), 320);
      return () => clearTimeout(timer);
    }
  }, [totalQuantity]);

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOverLimit) return;

    if (isStep1Treatments) {
      router.push("/book/datetime");
      return;
    }

    if (isStep2DateTime) {
      if (!hasPickedSlot) return;
      router.push("/book/details");
      return;
    }

    if (isStep3Details) {
      setIsSubmitting(true);

      const finalPayload = {
        start: selectedSlot,
        eventTypeId: Number(eventTypeId),
        duration: duration || totalMinutes,
        locationAddress: locationAddress || undefined,
        name: customerDetails.name.trim(),
        email: customerDetails.email.trim(),
        phoneNumber: customerDetails.phone.trim(),
        notes: customerDetails.notes?.trim() || "",
        locationId: selectedLocationId,
        cart,
        totalPrice,
        totalDeposit,
      };

      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalPayload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to complete reservation.");
        }

        const bookingId =
          data.data?.uid ||
          data.uid ||
          data.data?.id ||
          data.id ||
          "Unknown ID";

        // 1. Clear the client cart/state
        if (typeof clearCart === "function") clearCart();
        if (typeof resetFlow === "function") resetFlow();

        // 2. Force a hard browser navigation to the new root-level success page
        window.location.href = `/success/${bookingId}`;
      } catch (err: any) {
        console.error("Booking error:", err);
        alert(err.message || "Failed to submit booking.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!shouldRender) return null;

  const isButtonDisabled =
    isOverLimit ||
    (isStep2DateTime && !hasPickedSlot) ||
    (isStep3Details && (!hasFilledDetails || !eventTypeId || isSubmitting));

  return (
    <div
      className={`fixed bottom-6 inset-x-3 sm:inset-x-4 max-w-xl mx-auto z-50 origin-bottom transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-[0.88] translate-y-8 pointer-events-none"
      }`}
    >
      <div className="bg-[#1C1A18] text-white rounded-3xl border border-[#38332E] shadow-2xl overflow-hidden">
        {/* Animated Review Sheet */}
        <div
          id="review-sheet"
          role="region"
          aria-label="Selected treatments overview"
          aria-hidden={!isExpanded}
          className={`grid origin-bottom transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden bg-[#24211E] border-b border-[#38332E]">
            <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-sans font-bold text-2xl text-[#F5F2EB] leading-tight">
                    Selected Procedures
                  </h4>
                  <p className="text-sm text-[#B8AEA4] font-light mt-1">
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "treatment" : "treatments"} •{" "}
                    {formatMinutes(totalMinutes)}
                  </p>
                </div>

                <button
                  type="button"
                  tabIndex={isExpanded ? 0 : -1}
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close overview"
                  className="w-10 h-10 rounded-full bg-[#332E29] hover:bg-[#423C36] active:scale-95 text-[#E6E0D8] flex items-center justify-center transition shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Treatment list */}
              <div className="divide-y divide-[#38332E] bg-[#1C1A18] rounded-2xl border border-[#38332E] px-4 sm:px-5">
                {cart.map(({ treatment, quantity }) => (
                  <div
                    key={treatment.id}
                    className="py-4 sm:py-5 flex items-start justify-between gap-4 first:pt-4 last:pb-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm font-medium text-[#F5F2EB] leading-snug wrap-break-word">
                        {quantity > 1 ? `${quantity}x ` : ""}
                        {treatment.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#B8AEA4]">
                        <span className="text-[#DFC095] font-semibold">
                          {treatment.price}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 font-normal">
                          <Clock className="w-3.5 h-3.5 text-[#DFC095] shrink-0" />{" "}
                          {treatment.time ||
                            `${treatment.durationMinutes || 30} mins`}
                        </span>
                      </div>
                    </div>

                    {isStep1Treatments && (
                      <button
                        type="button"
                        tabIndex={isExpanded ? 0 : -1}
                        onClick={() => handleDecrement(treatment.id)}
                        aria-label={`Remove ${treatment.title}`}
                        className="h-9 px-3 rounded-xl bg-[#2A2622] hover:bg-red-950/40 hover:text-red-300 text-[#E6E0D8] border border-[#3D3833] flex items-center gap-1.5 text-xs font-normal transition active:scale-95 shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-[#A8A096]" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical limit warning */}
        {isOverLimit && (
          <div className="bg-[#2B1414] border-b border-red-900/60 px-5 py-3 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Maximum single-session limit is {formatMinutes(maxMinutes)} for
              clinical safety. Please remove a procedure to continue.
            </span>
          </div>
        )}

        {/* Action bar section */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-4 cursor-pointer select-none"
        >
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-x-2">
              <span className="font-bold text-lg text-white">
                £{totalPrice}
              </span>
              {totalDeposit > 0 && (
                <span className="text-xs text-[#B8AEA4]">
                  (£{totalDeposit} dep)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#DFC095] font-medium mt-0.5">
              <span>
                {totalQuantity}{" "}
                {totalQuantity === 1 ? "treatment" : "treatments"}
              </span>
              <span className="text-[#59524B]">•</span>
              <span
                className={`inline-flex items-center gap-1 ${
                  isOverLimit ? "text-red-400 font-semibold" : "text-[#B8AEA4]"
                }`}
              >
                <Clock className="w-3 h-3" />
                {formatMinutes(totalMinutes)}
              </span>

              <ChevronUp
                className={`w-4 h-4 ml-0.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isExpanded ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isButtonDisabled}
            onClick={handleAction}
            className={`relative h-11 px-5 sm:px-6 rounded-xl text-sm font-semibold tracking-wide overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md shrink-0 select-none ${
              isButtonDisabled
                ? "bg-[#2A2622] text-[#6E665D] border border-[#3D3833] cursor-not-allowed shadow-none"
                : "bg-[#B8925D] hover:bg-[#A8824C] active:scale-[0.98] text-white cursor-pointer"
            }`}
          >
            <div className="grid grid-cols-1 grid-rows-1 items-center justify-items-center">
              <div
                className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-all duration-200 ease-out ${
                  isSubmitting
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 -translate-y-2 pointer-events-none"
                }`}
              >
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Logging...</span>
              </div>

              <div
                className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-all duration-200 ease-out ${
                  !isSubmitting && isStep3Details
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 translate-y-2 pointer-events-none"
                }`}
              >
                <span>Confirm &amp; Reserve</span>
              </div>

              <div
                className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-all duration-200 ease-out ${
                  !isSubmitting && !isStep3Details
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 -translate-y-2 pointer-events-none"
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
