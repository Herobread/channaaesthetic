// app/book/pay-deposit/page.tsx
"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import BackLink from "@/components/ui/BackLink";
import { useCart } from "@/hooks/useCart";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    Square?: any;
  }
}

export default function PayDepositPage() {
  const router = useRouter();
  const cardInstanceRef = useRef<any>(null);

  const { cart, totalMinutes, totalPrice, totalDeposit, clearCart } = useCart();
  const { locations, selectedLocationId } = useClinicLocations();
  const { selectedSlot, customerDetails } = useBookingFlowStore();

  const [isSdkLoading, setIsSdkLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeLocation = useMemo(() => {
    return (
      locations.find((loc) => loc.id === selectedLocationId) || locations[0]
    );
  }, [locations, selectedLocationId]);

  const activeLocationId = activeLocation?.id;
  const squareAppId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;

  // Load Square Web Payments SDK & Mount Card Form
  useEffect(() => {
    if (!activeLocationId || !squareAppId || totalDeposit <= 0) return;

    let isMounted = true;

    async function initSquarePayment() {
      setIsSdkLoading(true);
      try {
        if (!window.Square) {
          let script = document.getElementById(
            "square-cdn-script",
          ) as HTMLScriptElement;

          if (!script) {
            script = document.createElement("script");
            script.id = "square-cdn-script";
            script.src = squareAppId.startsWith("sandbox-")
              ? "https://sandbox.web.squarecdn.com/v1/square.js"
              : "https://web.squarecdn.com/v1/square.js";
            script.async = true;
            document.head.appendChild(script);
          }

          let attempts = 0;
          while (!window.Square && attempts < 50) {
            await new Promise((r) => setTimeout(r, 100));
            attempts++;
          }
        }

        if (!window.Square) {
          throw new Error(
            "Unable to load Square Payments SDK. Please check your connection.",
          );
        }

        if (!isMounted) return;

        // Cleanup prior instance if hot reloaded
        if (cardInstanceRef.current) {
          try {
            await cardInstanceRef.current.destroy();
          } catch (_) {}
          cardInstanceRef.current = null;
        }

        const payments = window.Square.payments(squareAppId, activeLocationId);
        const card = await payments.card({
          style: {
            input: {
              color: "#1C1A18",
              fontSize: "14px",
            },
            "input::placeholder": {
              color: "#8C827A",
            },
          },
        });

        const mountPoint = document.getElementById("square-card-container");
        if (mountPoint && isMounted) {
          await card.attach("#square-card-container");
          cardInstanceRef.current = card;
          setIsSdkLoading(false);
          setErrorMessage(null);
        }
      } catch (err: any) {
        console.error("Square initialization failure:", err);
        if (isMounted) {
          setIsSdkLoading(false);
          setErrorMessage(
            err.message || "Could not load the payment interface.",
          );
        }
      }
    }

    initSquarePayment();

    return () => {
      isMounted = false;
      if (cardInstanceRef.current) {
        try {
          cardInstanceRef.current.destroy();
        } catch (_) {}
        cardInstanceRef.current = null;
      }
    };
  }, [activeLocationId, squareAppId, totalDeposit]);

  if (!selectedSlot || !customerDetails?.name) return null;
  const slotDate = new Date(selectedSlot);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (!cardInstanceRef.current) {
      setErrorMessage(
        "Payment module not initialized. Please refresh the page.",
      );
      return;
    }

    const targetService = cart[0]?.treatment;
    const variationId = targetService?.variationId || targetService?.id;

    if (!variationId || !activeLocationId) {
      setErrorMessage("Missing treatment or clinic location data.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Tokenize card details via Square SDK
      const tokenResult = await cardInstanceRef.current.tokenize();
      if (tokenResult.status !== "OK") {
        const detail =
          tokenResult.errors?.[0]?.message || "Invalid card details.";
        setErrorMessage(detail);
        setIsSubmitting(false);
        return;
      }

      // 2. Submit payment token and create booking
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: activeLocationId,
          startAt: selectedSlot,
          serviceVariationId: variationId,
          depositAmount: totalDeposit,
          sourceId: tokenResult.token,
          customer: {
            name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
          },
          notes: customerDetails.notes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Deposit authorization failed.");
      }

      const bookingId = json.booking?.id || json.booking?.uid;
      if (!bookingId) {
        throw new Error("Missing booking confirmation from Square.");
      }

      if (typeof clearCart === "function") clearCart();
      window.location.assign(`/success/${bookingId}`);
    } catch (err: any) {
      setErrorMessage(
        err.message || "An error occurred while confirming your booking.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <BackLink href="/book/details">Back to Edit Contact Details</BackLink>

      <header className="space-y-1.5">
        <h1 className="font-serif text-headline font-normal text-text-primary tracking-tight">
          Secure Your Booking
        </h1>
        <p className="text-caption font-sans text-text-muted">
          A non-refundable deposit is required to reserve your slot. The
          remaining balance will be settled at the clinic.
        </p>
      </header>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 bg-surface-elevated border border-accent/20 rounded-control text-caption font-sans text-accent shadow-subtle">
          <AlertCircle className="w-4 h-4 shrink-0 text-accent" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Payment Form (Left column on desktop, order-2 on mobile) */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            <div className="bg-surface-elevated border border-border-subtle rounded-control p-5 sm:p-6 shadow-subtle space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2 text-caption font-sans font-medium text-text-primary">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span>Card Details</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted font-sans">
                  <Lock className="w-3.5 h-3.5 text-accent" /> End-to-End
                  Encrypted
                </span>
              </div>

              {/* Square Web Payments SDK Mount Container */}
              <div className="relative min-h-[96px]">
                {isSdkLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-canvas rounded-control border border-border-subtle text-caption font-sans text-text-muted gap-2 z-10">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Loading secure payment gateway...</span>
                  </div>
                )}
                <div
                  id="square-card-container"
                  className={`p-3.5 border border-border-subtle rounded-control bg-surface-canvas transition-opacity duration-200 ${
                    isSdkLoading ? "opacity-0" : "opacity-100"
                  }`}
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-xs text-text-muted font-sans">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  Processed securely by Square Payments. Your card is charged
                  instantly for the deposit only.
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSdkLoading || isSubmitting}
              className={`w-full h-12 rounded-control text-caption font-sans font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-200 focus-ring-accent ${
                isSdkLoading || isSubmitting
                  ? "bg-surface-elevated text-text-muted border border-border-subtle cursor-not-allowed"
                  : "bg-accent hover:bg-accent/90 active:scale-[0.99] text-text-inverted cursor-pointer shadow-accent-glow"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing £{totalDeposit} Deposit...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay £{totalDeposit} Deposit & Confirm</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Booking Summary Card (Right column on desktop, order-1 on mobile) */}
        <aside className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-6">
          <div className="bg-surface-elevated border border-border-subtle rounded-control p-5 sm:p-6 shadow-subtle space-y-4">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <p className="text-body font-sans font-medium text-text-primary">
                  {cart[0]?.treatment?.title || "Clinical Treatment"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-caption font-sans text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                    {slotDate.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    at{" "}
                    {slotDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    {totalMinutes} mins
                  </span>
                </div>
              </div>
              <span className="text-caption font-sans font-medium text-text-primary whitespace-nowrap">
                £{totalPrice} Total
              </span>
            </div>

            <div className="space-y-2.5 text-caption font-sans text-text-muted">
              <div className="flex justify-between">
                <span>Patient</span>
                <span className="font-medium text-text-primary">
                  {customerDetails.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span className="font-medium text-text-primary">
                  {activeLocation?.name}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border-subtle text-text-primary font-medium text-body">
                <span>Deposit Due Now</span>
                <span className="text-accent">£{totalDeposit}.00</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
