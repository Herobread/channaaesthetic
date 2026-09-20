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
  Trash2,
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
    totalDeposit: hookDeposit,
    handleDecrement,
    maxMinutes = 180,
  } = useCart();

  const computedDeposit = cart.reduce((sum, item) => {
    const itemDeposit = Number(item.treatment?.deposit) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + itemDeposit * qty;
  }, 0);

  const totalDeposit =
    Number(hookDeposit) > 0 ? Number(hookDeposit) : computedDeposit;

  const { selectedSlot, isSubmitting } = useBookingFlowStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(totalQuantity > 0);
  const [isVisible, setIsVisible] = useState(false);

  const isStep1Treatments = pathname === "/" || pathname === "/book";
  const isStep2DateTime = pathname.includes("/datetime");
  const isStep3Details = pathname.includes("/details");
  const isStep4Payment = pathname.includes("/pay-deposit");

  const isOverLimit = totalMinutes > maxMinutes;
  const hasPickedSlot = Boolean(selectedSlot);

  const isButtonDisabled =
    isOverLimit || (isStep2DateTime && !hasPickedSlot) || isSubmitting;

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
    if (isButtonDisabled) return;

    if (isStep1Treatments) {
      router.push("/book/datetime");
      return;
    }

    if (isStep2DateTime) {
      if (!hasPickedSlot) return;
      router.push("/book/details");
      return;
    }
  };

  // Hide floating bar on Details and Payment steps so forms have standard on-screen buttons
  if (!shouldRender || isStep3Details || isStep4Payment) return null;

  return (
    <div
      className={`fixed bottom-3 inset-x-2 sm:bottom-6 sm:inset-x-4 max-w-xl mx-auto z-50 origin-bottom transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-[0.88] translate-y-8 pointer-events-none"
      }`}
    >
      <div className="bg-[#1C1A18] text-white rounded-2xl sm:rounded-3xl border border-[#38332E] shadow-2xl overflow-hidden">
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
            <div className="p-3.5 sm:p-5 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-sans font-bold text-lg sm:text-xl text-[#F5F2EB] leading-none">
                  Selected Procedures
                </h4>

                <button
                  type="button"
                  tabIndex={isExpanded ? 0 : -1}
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close overview"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#332E29] hover:bg-[#423C36] active:scale-95 text-[#E6E0D8] flex items-center justify-center transition shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Treatment list */}
              <div className="divide-y divide-[#38332E] bg-[#1C1A18] rounded-xl border border-[#38332E] px-3 sm:px-4">
                {cart.map(({ treatment, quantity }) => {
                  const itemDeposit = Number(treatment.deposit) || 0;

                  return (
                    <div
                      key={treatment.id}
                      className="py-2.5 sm:py-3.5 flex items-center justify-between gap-3 first:pt-3 last:pb-3"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-medium text-[#F5F2EB] leading-snug break-words">
                          {quantity > 1 ? `${quantity}x ` : ""}
                          {treatment.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#B8AEA4]">
                          <span className="text-[#DFC095] font-semibold">
                            £{treatment.price}
                          </span>
                          {itemDeposit > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-[#DFC095]">
                                £{itemDeposit * quantity} deposit
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1 font-normal">
                            <Clock className="w-3 h-3 text-[#DFC095] shrink-0" />{" "}
                            {treatment.time ||
                              `${treatment.durationMinutes || 30} mins`}
                          </span>
                        </div>
                      </div>

                      {isStep1Treatments && (
                        <button
                          type="button"
                          tabIndex={isExpanded ? 0 : -1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecrement(treatment.id);
                          }}
                          aria-label={`Remove ${treatment.title}`}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2A2622] hover:bg-red-950/40 text-[#A8A096] hover:text-red-300 border border-[#3D3833] flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical limit warning */}
        {isOverLimit && (
          <div className="bg-[#2B1414] border-b border-red-900/60 px-3.5 py-2 sm:px-5 sm:py-3 flex items-start gap-2 sm:gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-tight sm:leading-relaxed">
              Maximum single-session limit is {formatMinutes(maxMinutes)} for
              clinical safety. Please remove a procedure to continue.
            </span>
          </div>
        )}

        {/* Action bar section */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="px-3.5 py-2.5 sm:px-6 sm:py-4 flex items-center justify-between gap-2.5 sm:gap-4 cursor-pointer select-none"
        >
          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-baseline gap-x-1.5 sm:gap-x-2 flex-wrap leading-tight">
              <span className="font-bold text-lg text-white">
                £{totalPrice}
              </span>
              {totalDeposit > 0 && (
                <span className="text-xs text-[#DFC095] whitespace-nowrap">
                  (£{totalDeposit} deposit due)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#DFC095] font-medium mt-0.5">
              <span className="truncate">
                {totalQuantity}{" "}
                {totalQuantity === 1 ? "treatment" : "treatments"}
              </span>
              <span className="text-[#59524B] shrink-0">•</span>
              <span
                className={`inline-flex items-center gap-1 shrink-0 ${
                  isOverLimit ? "text-red-400 font-semibold" : "text-[#B8AEA4]"
                }`}
              >
                <Clock className="w-3 h-3" />
                {formatMinutes(totalMinutes)}
              </span>

              <ChevronUp
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isExpanded ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isButtonDisabled}
            onClick={handleAction}
            className={`relative h-10 sm:h-11 px-4 sm:px-6 rounded-xl text-sm font-semibold tracking-wide overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md shrink-0 select-none ${
              isButtonDisabled
                ? "bg-[#2A2622] text-[#6E665D] border border-[#3D3833] cursor-not-allowed shadow-none"
                : "bg-[#B8925D] hover:bg-[#A8824C] active:scale-[0.98] text-white cursor-pointer"
            }`}
          >
            <div className="grid grid-cols-1 grid-rows-1 items-center justify-items-center">
              <div
                className={`col-start-1 row-start-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ease-out ${
                  isSubmitting
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 -translate-y-2 pointer-events-none"
                }`}
              >
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Securing Slot...</span>
              </div>

              <div
                className={`col-start-1 row-start-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ease-out ${
                  !isSubmitting
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
