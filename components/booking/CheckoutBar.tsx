"use client";

import { MappedTreatment } from "@/api/useTreatments";
import { SelectedItem } from "@/hooks/useCart";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Minus,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CheckoutBarProps {
  cart: SelectedItem[];
  totalQuantity: number;
  totalPrice: number;
  onIncrement: (treatment: MappedTreatment) => void;
  onDecrement: (treatmentId: string) => void;
  onCheckout: () => void;
}

export default function CheckoutBar({
  cart,
  totalQuantity,
  totalPrice,
  onIncrement,
  onDecrement,
  onCheckout,
}: CheckoutBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(totalQuantity > 0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (totalQuantity > 0) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalQuantity]);

  if (!shouldRender) return null;

  const totalDeposit = cart.reduce((acc, curr) => {
    const depVal = curr.treatment.deposit
      ? parseFloat(curr.treatment.deposit.replace(/[^0-9.]/g, "")) || 0
      : 0;
    return acc + depVal * curr.quantity;
  }, 0);

  return (
    <>
      {/* Floating Dock Container */}
      <div
        className={`fixed bottom-6 inset-x-4 max-w-xl mx-auto z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-12 scale-90 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-3xl border border-[#EBE5DF] shadow-xl overflow-hidden">
          {/* Animated Review Sheet */}
          <div
            id="review-sheet"
            role="region"
            aria-label="Selected procedures review"
            aria-hidden={!isExpanded}
            className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isExpanded
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="p-4 border-b border-[#EBE5DF] bg-white max-h-64 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8C827A]">
                    Selected Procedures
                  </span>
                  <button
                    type="button"
                    tabIndex={isExpanded ? 0 : -1}
                    onClick={() => setIsExpanded(false)}
                    className="text-xs font-medium text-[#1A1A1A] hover:text-[#B8925D] transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                <div className="divide-y divide-[#EBE5DF]">
                  {cart.map(({ treatment, quantity }) => (
                    <div
                      key={treatment.id}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">
                          {treatment.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#8C827A] mt-0.5">
                          <span className="font-semibold text-[#1A1A1A]">
                            {treatment.price}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#B8925D]" />{" "}
                            {treatment.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#FAFAF8] border border-[#EBE5DF] rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          tabIndex={isExpanded ? 0 : -1}
                          onClick={() => onDecrement(treatment.id)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#78716C] hover:bg-white hover:text-red-500 transition cursor-pointer"
                        >
                          {quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-xs font-semibold px-2 text-center min-w-5 text-[#1A1A1A]">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          tabIndex={isExpanded ? 0 : -1}
                          onClick={() => onIncrement(treatment)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#B8925D] text-white hover:bg-[#9E7B4C] transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Dock Bar */}
          <div className="p-4 flex items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#FAFAF8] border border-[#EBE5DF] flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-[#B8925D]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#8C827A]">
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "treatment" : "treatments"}
                  </span>

                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls="review-sheet"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FAFAF8] hover:bg-[#EBE5DF] border border-[#EBE5DF] text-xs font-medium text-[#1A1A1A] transition cursor-pointer"
                  >
                    <span>{isExpanded ? "Close" : "Review"}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#8C827A]" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-[#8C827A]" />
                    )}
                  </button>
                </div>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-serif text-xl font-bold text-[#1A1A1A] leading-tight">
                    £{totalPrice}
                  </span>
                  {totalDeposit > 0 && (
                    <span className="text-xs text-[#78716C] font-normal">
                      (£{totalDeposit} deposit)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Original Simple Button */}
            <button
              type="button"
              onClick={onCheckout}
              className="h-12 px-6 rounded-xl bg-[#B8925D] hover:bg-[#9E7B4C] text-white text-sm font-bold tracking-wider flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <span>Select Date</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
