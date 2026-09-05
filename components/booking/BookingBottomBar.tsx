// components/booking/BookingBottomBar.tsx
"use client";

import { SelectedItem } from "@/hooks/useCart";
import { ChevronUp, Loader2, X } from "lucide-react";
import { useState } from "react";

interface BookingBottomBarProps {
  cart: SelectedItem[];
  totalQuantity: number;
  totalPrice: number;
  totalDeposit: number;
  selectedSlot: string | null;
  locationName?: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export default function BookingBottomBar({
  cart,
  totalQuantity,
  totalPrice,
  totalDeposit,
  selectedSlot,
  locationName,
  isSubmitting,
  canSubmit,
  onSubmit,
}: BookingBottomBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-4 max-w-xl mx-auto z-50">
      <div className="bg-[#1C1A18] text-white rounded-3xl border border-[#38332E] shadow-2xl overflow-hidden">
        {/* Expandable Order Details Drawer */}
        <div
          className={`grid origin-bottom transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden bg-[#24211E] border-b border-[#38332E]">
            <div className="p-4 sm:p-5 max-h-[50vh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#DFC095]">
                  Procedure Breakdown
                </span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-full bg-[#332E29] text-[#E6E0D8] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-[#38332E] bg-[#1C1A18] rounded-xl border border-[#38332E] px-3.5">
                {cart.map(({ treatment, quantity }) => (
                  <div
                    key={treatment.id}
                    className="py-2.5 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-medium text-[#F5F2EB]">
                        {quantity}x {treatment.title}
                      </p>
                      <p className="text-[#8C827A]">{treatment.time}</p>
                    </div>
                    <span className="text-[#DFC095] font-semibold">
                      £{treatment.priceNum * quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs text-[#B8AEA4] pt-1">
                <div className="flex justify-between">
                  <span>Total Treatment Cost</span>
                  <span className="text-white font-medium">£{totalPrice}</span>
                </div>
                <div className="flex justify-between text-white font-semibold">
                  <span>Deposit Due Now</span>
                  <span className="text-[#DFC095]">£{totalDeposit}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#8C827A]">
                  <span>Balance Due at Appointment</span>
                  <span>£{Math.max(0, totalPrice - totalDeposit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3">
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex flex-col min-w-0 cursor-pointer select-none"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base sm:text-lg text-white">
                £{totalDeposit}
              </span>
              <span className="text-[11px] text-[#B8AEA4]">deposit</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#DFC095] font-medium">
              <span>
                {totalQuantity}{" "}
                {totalQuantity === 1 ? "treatment" : "treatments"}
              </span>
              <ChevronUp
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isExpanded ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            className="h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-[#B8925D] hover:bg-[#A8824C] active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Reserving...</span>
              </>
            ) : (
              <>
                <span>
                  {selectedSlot ? "Confirm & Reserve" : "Select a Time"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
