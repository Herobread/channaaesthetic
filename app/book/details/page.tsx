"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import NavBarLogoOnly from "@/components/ui/NavBarLogoOnly";
import { useCart } from "@/hooks/useCart";
import { useAppStore } from "@/store/useAppStore";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function PatientDetailsPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const { cart, totalMinutes, totalPrice, totalDeposit, clearCart } = useCart();
  const selectedLocationId = useAppStore((state) => state.selectedLocationId);
  const { locations } = useClinicLocations();
  const { selectedSlot, customerDetails, setCustomerDetails } =
    useBookingFlowStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeLocation = useMemo(() => {
    return (
      locations.find((loc) => loc.id === selectedLocationId) || locations[0]
    );
  }, [locations, selectedLocationId]);

  // Guard: Return to slot picker if no slot is stored
  useEffect(() => {
    if (!selectedSlot) {
      router.replace("/book/datetime");
    }
  }, [selectedSlot, router]);

  if (!selectedSlot) return null;
  const slotDate = new Date(selectedSlot);

  const handleBookingSubmission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // 1. Read directly from the DOM / FormData (100% immune to React autofill lag)
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    // 2. Validate fields with immediate visual feedback
    if (!fullName) {
      setErrorMessage("Please enter your full name.");
      form.querySelector<HTMLInputElement>('input[name="fullName"]')?.focus();
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      form.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
      return;
    }
    if (!phone) {
      setErrorMessage("Please enter your contact phone number.");
      form.querySelector<HTMLInputElement>('input[name="phone"]')?.focus();
      return;
    }

    // 3. Extract Square serviceVariationId (prefer variationId over parent id)
    const targetService = cart[0]?.treatment;
    const variationId = targetService?.variationId || targetService?.id;
    const locationId = activeLocation?.id;

    if (!variationId) {
      setErrorMessage("No treatment selected. Please return to the menu.");
      return;
    }
    if (!locationId) {
      setErrorMessage("No clinic location active. Please reselect a location.");
      return;
    }

    setIsSubmitting(true);

    // Sync back to Zustand store for history/receipts
    setCustomerDetails({
      name: fullName,
      email,
      phone,
      notes,
    });

    const payload = {
      locationId,
      startAt: selectedSlot,
      serviceVariationId: variationId,
      customer: {
        name: fullName,
        email,
        phone,
      },
      notes: notes || undefined,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to commit booking in Square");
      }

      if (typeof clearCart === "function") clearCart();
      router.push(`/book/confirmation?bookingId=${json.booking?.id || ""}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to confirm booking.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B8925D]/20 selection:text-[#B8925D]">
      <NavBarLogoOnly theme="dark" />

      <main className="max-w-xl mx-auto px-4 pt-20 pb-44 space-y-5">
        <Link
          href="/book/datetime"
          className="inline-flex items-center text-xs text-[#8C827A] gap-1 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Time Selection
        </Link>

        {/* Selected Slot Summary Card */}
        <div className="bg-white border border-[#EBE5DF] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
              <CalendarIcon className="w-3.5 h-3.5 text-[#B8925D]" />
              <span>
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
            </div>
            <p className="text-[11px] text-[#8C827A] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#B8925D]" />
              {activeLocation?.name || "Clinic"} • {totalMinutes}m appointment
            </p>
          </div>

          <Link
            href="/book/datetime"
            className="text-xs text-[#B8925D] hover:underline font-medium shrink-0"
          >
            Change
          </Link>
        </div>

        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-medium text-[#1A1A1A]">
            Patient Contact Details
          </h1>
          <p className="text-xs text-[#8C827A] mt-1">
            We require your details to secure the booking and prepare clinical
            notes.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Contact Input Form - Uncontrolled inputs to capture autofill instantly */}
        <form
          ref={formRef}
          onSubmit={handleBookingSubmission}
          className="space-y-4"
        >
          <div className="bg-white border border-[#EBE5DF] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A] pb-1 border-b border-[#F4EFEA]">
              <User className="w-3.5 h-3.5 text-[#B8925D]" />
              <span>Personal Information</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#666666] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  defaultValue={customerDetails?.name || ""}
                  placeholder="Jane Doe"
                  className="w-full text-xs p-3 rounded-xl border border-[#EBE5DF] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:border-[#B8925D] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#666666] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    defaultValue={customerDetails?.email || ""}
                    placeholder="jane@example.com"
                    className="w-full text-xs p-3 rounded-xl border border-[#EBE5DF] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:border-[#B8925D] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#666666] mb-1">
                    Mobile Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      defaultValue={customerDetails?.phone || ""}
                      placeholder="+44 7123 456789"
                      className="w-full text-xs pl-8 p-3 rounded-xl border border-[#EBE5DF] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:border-[#B8925D] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#666666] mb-1">
                  Medical Notes / Considerations (Optional)
                </label>
                <textarea
                  rows={3}
                  name="notes"
                  defaultValue={customerDetails?.notes || ""}
                  placeholder="Any previous treatments, allergies, or questions for the practitioner..."
                  className="w-full text-xs p-3 rounded-xl border border-[#EBE5DF] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:border-[#B8925D] transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Floating Bottom Bar (ALWAYS ACTIVE AND NEVER BLOCKED) */}
      <div className="fixed bottom-6 inset-x-3 sm:inset-x-4 max-w-xl mx-auto z-50">
        <div className="bg-[#1C1A18] text-white rounded-3xl border border-[#38332E] shadow-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg text-white">
                £{totalPrice}
              </span>
              {totalDeposit > 0 && (
                <span className="text-xs text-[#B8AEA4]">
                  (£{totalDeposit} dep)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#DFC095] mt-0.5">
              <span>
                {cart.length} {cart.length === 1 ? "treatment" : "treatments"}
              </span>
              <span className="text-[#59524B]">•</span>
              <span className="flex items-center gap-1 text-[#B8AEA4]">
                <Clock className="w-3 h-3" /> {totalMinutes}m
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleBookingSubmission()}
            className="h-11 px-6 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 bg-[#B8925D] hover:bg-[#A8824C] active:scale-95 text-white cursor-pointer transition-all shadow-md disabled:opacity-50 shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Securing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Confirm Booking</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
