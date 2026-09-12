"use client";

import { MappedTreatment } from "@/api/useTreatments";
import { SelectedItem } from "@/hooks/useCart";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronUp,
  Clock,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CheckoutBarProps {
  cart: SelectedItem[];
  totalQuantity: number;
  totalPrice: number;
  totalMinutes: number;
  totalDeposit?: number;
  maxMinutes?: number;
  selectedSlot?: string | null;
  ctaText?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  onDecrement: (treatmentId: string) => void;
  onAction: () => void;
}

function formatMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, isNaN(minutes) ? 0 : minutes);
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export default function CheckoutBar({
  cart,
  totalQuantity,
  totalPrice,
  totalMinutes,
  totalDeposit = 0,
  maxMinutes = 180,
  selectedSlot,
  ctaText = "Continue",
  isSubmitting = false,
  isDisabled = false,
  onDecrement,
  onAction,
}: CheckoutBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(totalQuantity > 0);
  const [isVisible, setIsVisible] = useState(false);

  const isOverLimit = totalMinutes > maxMinutes;

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

  if (!shouldRender) return null;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOverLimit || isDisabled || isSubmitting) return;
    onAction();
  };

  const slotDate = selectedSlot ? new Date(selectedSlot) : null;

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
            <div className="p-5 sm:p-6 max-h-[50vh] overflow-y-auto space-y-4">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  aria-label="Close overview"
                  className="w-10 h-10 rounded-full bg-[#332E29] hover:bg-[#423C36] active:scale-95 text-[#E6E0D8] flex items-center justify-center transition shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Items List */}
              <div className="divide-y divide-[#38332E] bg-[#1C1A18] rounded-2xl border border-[#38332E] px-4 sm:px-5">
                {cart.map(({ treatment, quantity }) => {
                  const targetId = treatment.variationId || treatment.id;

                  return (
                    <div
                      key={targetId}
                      className="py-4 flex items-start justify-between gap-4 first:pt-4 last:pb-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-[#F5F2EB] leading-snug break-words">
                          {quantity > 1 ? `${quantity}x ` : ""}
                          {treatment.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#B8AEA4]">
                          <span className="text-[#DFC095] font-semibold">
                            {treatment.price}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-normal">
                            <Clock className="w-3.5 h-3.5 text-[#DFC095] shrink-0" />{" "}
                            {treatment.time ||
                              `${treatment.durationMinutes || 30} mins`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        tabIndex={isExpanded ? 0 : -1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDecrement(targetId);
                        }}
                        aria-label={`Remove ${treatment.title}`}
                        className="h-8 px-2.5 rounded-lg bg-[#2A2622] hover:bg-red-950/40 hover:text-red-300 text-[#E6E0D8] border border-[#3D3833] flex items-center gap-1 text-xs transition active:scale-95 shrink-0 cursor-pointer"
                      >
                        <X className="w-3 h-3 text-[#A8A096]" />
                        <span>Remove</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Safety Warning */}
        {isOverLimit && (
          <div className="bg-[#2B1414] border-b border-red-900/60 px-5 py-3 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Maximum single-session limit is {formatMinutes(maxMinutes)}.
              Please remove a procedure or book a consultation first.
            </span>
          </div>
        )}

        {/* Trigger Bar */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
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
              {slotDate ? (
                <span className="inline-flex items-center gap-1 text-white">
                  <Calendar className="w-3 h-3 text-[#B8925D]" />
                  {slotDate.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  {slotDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : (
                <>
                  <span>
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "treatment" : "treatments"}
                  </span>
                  <span className="text-[#59524B]">•</span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      isOverLimit
                        ? "text-red-400 font-semibold"
                        : "text-[#B8AEA4]"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {formatMinutes(totalMinutes)}
                  </span>
                </>
              )}

              <ChevronUp
                className={`w-4 h-4 ml-0.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isExpanded ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isOverLimit || isDisabled || isSubmitting}
            onClick={handleButtonClick}
            className={`h-11 px-5 sm:px-6 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition shadow-md shrink-0 ${
              isOverLimit || isDisabled || isSubmitting
                ? "bg-[#2A2622] text-[#6E665D] border border-[#3D3833] cursor-not-allowed"
                : "bg-[#B8925D] hover:bg-[#A8824C] active:scale-[0.98] text-white cursor-pointer"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Securing...</span>
              </>
            ) : (
              <>
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
