"use client";

import LocationPicker from "@/components/shared/LocationPicker";
import { CheckCircle2, ChevronRight, PhoneCall, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface BookingCardProps {
  className?: string;
  id?: string;
}

export default function BookingCard({
  className = "",
  id = "book",
}: BookingCardProps) {
  const [selectedLocation, setSelectedLocation] = useState("london");

  return (
    <div
      id={id}
      className={`bg-white rounded-3xl p-6 sm:p-9 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] border border-[#EBE5DF] space-y-6 ${className}`}
    >
      <div className="text-center space-y-1.5">
        <h2 className="font-serif text-3xl font-medium text-[#1A1A1A]">
          Book an Appointment
        </h2>
        <p className="text-base text-[#666666] font-light">
          Choose your location to see available times.
        </p>
      </div>

      <LocationPicker />

      {/* Primary Action Button */}
      <Link
        href={"/book"}
        className="w-full h-14 bg-[#B8925D] hover:bg-[#9E7B4C] active:bg-[#8A6A3F] text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 shadow-sm transition"
      >
        <span>Book Appointment</span>
        <ChevronRight className="w-5 h-5" />
      </Link>

      {/* Secondary Paths */}
      <div className="grid gap-3 pt-2">
        <Link
          href="#treatments"
          className="group flex items-center gap-4 p-4 rounded-xl border border-[#EBE5DF] hover:border-[#B8925D] bg-white hover:shadow-xs transition"
        >
          <div className="w-11 h-11 rounded-lg bg-[#B8925D]/10 text-[#B8925D] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              View Treatments &amp; Pricing
            </h3>
            <p className="text-base text-[#666666] font-light">
              See full price list &amp; procedure options
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#B8925D] transition transform group-hover:translate-x-1" />
        </Link>

        <a
          href="tel:+440000000000"
          className="group flex items-center gap-4 p-4 rounded-xl border border-[#EBE5DF] hover:border-[#B8925D] bg-white hover:shadow-xs transition"
        >
          <div className="w-11 h-11 rounded-lg bg-[#B8925D]/10 text-[#B8925D] flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Speak With Us
            </h3>
            <p className="text-base text-[#666666] font-light">
              Ask a clinician a question before booking
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#B8925D] transition transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Bottom Note */}
      <div className="pt-4 border-t border-[#EBE5DF] flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C] font-light">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#B8925D]" /> Doctor-led
          assessment
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#B8925D]" /> No pressure to
          proceed on the day
        </span>
      </div>
    </div>
  );
}
