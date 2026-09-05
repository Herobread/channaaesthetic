"use client";

import { MappedTreatment } from "@/api/useTreatments";
import { SelectedItem } from "@/hooks/useCart";
import { ArrowRight, ChevronUp, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CheckoutBarProps {
  cart: SelectedItem[];
  totalQuantity: number;
  totalPrice: number;
  onIncrement?: (treatment: MappedTreatment) => void;
  onDecrement: (treatmentId: string) => void;
  onCheckout?: () => void;
}

export default function CheckoutBar({
  cart,
  totalQuantity,
  totalPrice,
  onDecrement,
  onCheckout,
}: CheckoutBarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(totalQuantity > 0);
  const [isVisible, setIsVisible] = useState(false);

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

  const handleSelectDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCheckout) onCheckout();
    router.push("/book/datetime");
  };

  if (!shouldRender) return null;

  const totalDeposit = cart.reduce((acc, curr) => {
    const depVal = curr.treatment.deposit
      ? parseFloat(curr.treatment.deposit.replace(/[^0-9.]/g, "")) || 0
      : 0;
    return acc + depVal;
  }, 0);

  return (
    <div
      className={`fixed bottom-6 inset-x-3 sm:inset-x-4 max-w-xl mx-auto z-50 origin-bottom transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
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
          className={`grid origin-bottom transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden bg-[#24211E] border-b border-[#38332E]">
            <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-sans font-bold text-2xl text-[#F5F2EB] leading-tight">
                    Selected Procedures
                  </h4>
                  <p className="text-base text-[#B8AEA4] font-light mt-1">
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "treatment" : "treatments"} in plan
                  </p>
                </div>

                <button
                  type="button"
                  tabIndex={isExpanded ? 0 : -1}
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close overview"
                  className="w-11 h-11 rounded-full bg-[#332E29] hover:bg-[#423C36] active:scale-95 text-[#E6E0D8] flex items-center justify-center transition-transform duration-150 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#38332E] bg-[#1C1A18] rounded-2xl border border-[#38332E] px-4 sm:px-5">
                {cart.map(({ treatment }) => (
                  <div
                    key={treatment.id}
                    className="py-4 sm:py-5 flex items-start justify-between gap-4 first:pt-4 last:pb-4"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-base font-medium text-[#F5F2EB] leading-snug break-words">
                        {treatment.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base text-[#B8AEA4]">
                        <span className="text-[#DFC095] font-semibold">
                          {treatment.price}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 font-normal">
                          <Clock className="w-4 h-4 text-[#DFC095] shrink-0" />{" "}
                          {treatment.time}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      tabIndex={isExpanded ? 0 : -1}
                      onClick={() => onDecrement(treatment.id)}
                      aria-label={`Remove ${treatment.title}`}
                      className="h-11 px-4 rounded-xl bg-[#2A2622] hover:bg-red-950/40 hover:text-red-300 text-[#E6E0D8] border border-[#3D3833] flex items-center gap-2 text-base font-normal transition active:scale-95 cursor-pointer shrink-0 mt-0.5"
                    >
                      <X className="w-4 h-4 text-[#A8A096]" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Solid Bar Section */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 cursor-pointer select-none"
        >
          <div className="flex flex-col min-w-0 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-bold tracking-tight text-white leading-tight">
                £{totalPrice}
              </span>
              {totalDeposit > 0 && (
                <span className="text-base text-[#B8AEA4] font-light">
                  (£{totalDeposit} deposit)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-base text-[#DFC095] font-medium">
              <span>
                {totalQuantity}{" "}
                {totalQuantity === 1 ? "treatment" : "treatments"}
              </span>
              <ChevronUp
                className={`w-5 h-5 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                  isExpanded ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSelectDate}
            className="h-13 px-6 sm:px-7 rounded-2xl bg-[#B8925D] hover:bg-[#A8824C] active:scale-[0.98] text-white text-base font-semibold tracking-wide flex items-center gap-2.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
