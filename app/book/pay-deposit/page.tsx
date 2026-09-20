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

const SQUARE_ERROR_MAP: Record<string, string> = {
  INVALID_EXPIRATION: "Your card expiration date is invalid or in the past.",
  INVALID_EXPIRATION_DATE:
    "Your card expiration date is invalid or in the past.",
  INVALID_CARD_DATA:
    "The card information entered is invalid. Please re-check the number.",
  INVALID_CARD: "The card number is invalid.",
  UNSUPPORTED_CARD_BRAND:
    "This card type is not accepted. Please try a different card.",
  INVALID_CVV: "The security code (CVV) is incorrect.",
  INVALID_POSTAL_CODE:
    "The postal code does not match the billing address for this card.",
  CARD_DECLINED:
    "Your card was declined by the bank. Please try another payment method.",
  CARD_DECLINED_CALL_ISSUER:
    "Your card was declined. Please contact your bank or use another card.",
  INSUFFICIENT_FUNDS: "The transaction was declined due to insufficient funds.",
  CARD_EXPIRED: "This card has expired. Please use a valid card.",
  CARD_TOKEN_EXPIRED:
    "The payment session timed out. Please re-enter your card details.",
  CVV_FAILURE: "The security code (CVV) failed verification.",
  ADDRESS_VERIFICATION_FAILURE:
    "Billing address verification failed. Please check your registered postcode.",
  VERIFY_CVV_FAILURE: "Could not verify your card security code.",
  TRANSACTION_LIMIT: "This transaction exceeds your card's spending limit.",
  GENERIC_DECLINE:
    "Your card was declined. Please check with your bank or try another card.",
};

function formatSquareError(raw: string | undefined | null): string {
  if (!raw) {
    return "An error occurred while confirming your booking. Please try again.";
  }

  for (const [code, friendlyMessage] of Object.entries(SQUARE_ERROR_MAP)) {
    if (raw.includes(code)) {
      return friendlyMessage;
    }
  }

  return raw;
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

  // Validate prerequisite data
  const hasCart = cart.length > 0;
  const hasSlot = Boolean(selectedSlot);
  const hasDetails = Boolean(
    customerDetails?.name && customerDetails?.email && customerDetails?.phone,
  );
  const requiresDeposit = totalDeposit > 0;

  const isValidSession = hasCart && hasSlot && hasDetails && requiresDeposit;

  // ROUTE GUARD: Cascade back to the earliest missing step
  useEffect(() => {
    if (!hasCart) {
      router.replace("/book");
      return;
    }

    if (!hasSlot) {
      router.replace("/book/datetime");
      return;
    }

    if (!hasDetails) {
      router.replace("/book/details");
      return;
    }

    if (!requiresDeposit) {
      // Zero-deposit bookings must be confirmed on /book/details directly
      router.replace("/book/details");
      return;
    }
  }, [hasCart, hasSlot, hasDetails, requiresDeposit, router]);

  const activeLocation = useMemo(() => {
    return (
      locations.find((loc) => loc.id === selectedLocationId) || locations[0]
    );
  }, [locations, selectedLocationId]);

  const activeLocationId = activeLocation?.id;
  const squareAppId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || "";

  // Initialize Square SDK only if the session is strictly valid
  useEffect(() => {
    if (!isValidSession || !activeLocationId || !squareAppId) return;

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
              color: "#1A1A1A",
              fontSize: "14px",
              fontFamily: "inherit",
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
  }, [isValidSession, activeLocationId, squareAppId]);

  // Block rendering until session verification succeeds
  if (!isValidSession) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-text-muted gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span className="text-caption font-sans font-medium tracking-wide">
          Verifying booking details...
        </span>
      </div>
    );
  }

  const slotDate = new Date(selectedSlot!);

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
      const tokenResult = await cardInstanceRef.current.tokenize();
      if (tokenResult.status !== "OK") {
        const rawCode =
          tokenResult.errors?.[0]?.code ||
          tokenResult.errors?.[0]?.detail ||
          tokenResult.errors?.[0]?.message;
        setErrorMessage(formatSquareError(rawCode));
        setIsSubmitting(false);
        return;
      }

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
        throw new Error(
          formatSquareError(json.error || json.detail || json.message),
        );
      }

      const bookingId = json.booking?.id || json.booking?.uid;
      if (!bookingId) {
        throw new Error("Missing booking confirmation from Square.");
      }

      if (typeof clearCart === "function") clearCart();
      window.location.assign(`/success/${bookingId}`);
    } catch (err: any) {
      setErrorMessage(formatSquareError(err.message));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <BackLink href="/book/details">Back to contact details</BackLink>

      <header className="space-y-1.5">
        <h1 className="font-serif text-headline font-normal text-text-primary tracking-tight">
          Secure your booking
        </h1>
        <p className="text-caption font-sans text-text-muted">
          A non-refundable deposit is required to reserve your slot. The
          remaining balance will be settled at the clinic.
        </p>
      </header>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 bg-surface-error border border-border-error rounded-control text-caption font-sans text-text-error shadow-subtle">
          <AlertCircle className="w-4 h-4 shrink-0 text-text-error" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Payment Form: Single Clean Card */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <form onSubmit={handlePaymentSubmit} className="space-y-5" noValidate>
            <div className="bg-surface-elevated border border-border-subtle rounded-card p-5 sm:p-6 shadow-subtle space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2 text-caption font-sans font-medium text-text-primary">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span>Card details</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-caption text-text-muted font-sans">
                  <Lock className="w-3.5 h-3.5 text-accent" /> End-to-end
                  encrypted
                </span>
              </div>

              {/* Square Mount Container */}
              <div className="relative min-h-24">
                {isSdkLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-caption font-sans text-text-muted gap-2 z-10">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Loading secure payment gateway...</span>
                  </div>
                )}
                <div
                  id="square-card-container"
                  className={`w-full transition-opacity duration-200 ${
                    isSdkLoading ? "opacity-0" : "opacity-100"
                  }`}
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-caption text-text-muted font-sans border-t border-border-subtle">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  Processed securely by Square Payments. Your card is charged
                  instantly for the deposit only.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSdkLoading || isSubmitting}
              className={`w-full h-12 rounded-control text-caption font-sans font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-200 focus-ring-accent ${
                isSdkLoading || isSubmitting
                  ? "bg-surface-elevated text-text-muted border border-border-subtle cursor-not-allowed"
                  : "bg-accent hover:bg-accent-hover active:scale-[0.99] text-text-inverted cursor-pointer shadow-accent-glow"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing £{totalDeposit} deposit...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay £{totalDeposit} deposit & confirm</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Booking Summary Card */}
        <aside className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-6">
          <div className="bg-surface-elevated border border-border-subtle rounded-card p-5 sm:p-6 shadow-subtle space-y-4">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <p className="font-serif text-title font-medium text-text-primary">
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
                £{totalPrice} total
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
                <span>Deposit due now</span>
                <span className="text-accent">£{totalDeposit}.00</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
