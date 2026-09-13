"use client";

import { useClinicLocations } from "@/api/useClinicLocations";
import NavBarLogoOnly from "@/components/ui/NavBarLogoOnly";
import { useCart } from "@/hooks/useCart";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
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

  const { totalMinutes } = useCart();
  const { locations, selectedLocationId } = useClinicLocations();
  const {
    selectedSlot,
    customerDetails,
    setCustomerDetails,
    setIsDetailsValid,
  } = useBookingFlowStore();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controlled input states initialized from store
  const [name, setName] = useState(customerDetails?.name || "");
  const [email, setEmail] = useState(customerDetails?.email || "");
  const [phone, setPhone] = useState(customerDetails?.phone || "");
  const [notes, setNotes] = useState(customerDetails?.notes || "");

  const activeLocation = useMemo(() => {
    return (
      locations.find((loc) => loc.id === selectedLocationId) || locations[0]
    );
  }, [locations, selectedLocationId]);

  // Real-time validation check
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = email.includes("@") && email.includes(".");
  const isPhoneValid = phone.replace(/[^0-9+]/g, "").length >= 9;

  const isFormValid = isNameValid && isEmailValid && isPhoneValid;

  // Sync validation status with the store for BookingBar
  useEffect(() => {
    setIsDetailsValid(isFormValid);
    return () => setIsDetailsValid(false);
  }, [isFormValid, setIsDetailsValid]);

  // Guard: Return to slot picker if no slot is selected
  useEffect(() => {
    if (!selectedSlot) {
      router.replace("/book/datetime");
    }
  }, [selectedSlot, router]);

  if (!selectedSlot) return null;
  const slotDate = new Date(selectedSlot);

  const handleDetailsSubmission = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!isNameValid) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!isEmailValid) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!isPhoneValid) {
      setErrorMessage("Please enter your contact phone number.");
      return;
    }

    setCustomerDetails({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
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
          <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          id="booking-form"
          ref={formRef}
          onSubmit={handleDetailsSubmission}
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
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setCustomerDetails({ name: e.target.value });
                  }}
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setCustomerDetails({ email: e.target.value });
                    }}
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
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setCustomerDetails({ phone: e.target.value });
                      }}
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
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setCustomerDetails({ notes: e.target.value });
                  }}
                  placeholder="Any previous treatments, allergies, or questions for the practitioner..."
                  className="w-full text-xs p-3 rounded-xl border border-[#EBE5DF] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:border-[#B8925D] transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
