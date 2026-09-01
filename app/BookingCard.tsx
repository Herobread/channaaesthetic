"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MapPin,
  PhoneCall,
  Sparkles,
} from "lucide-react";
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

      {/* Location Selector */}
      <div className="space-y-2">
        <label
          htmlFor="clinic-select"
          className="text-xs font-semibold uppercase tracking-wider text-[#8C827A] block"
        >
          Clinic Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8925D] pointer-events-none" />
          <select
            id="clinic-select"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            aria-label="Select Clinic Location"
            className="w-full h-14 bg-[#FAFAF8] border border-[#EBE5DF] rounded-xl pl-12 pr-10 text-base font-medium text-[#1A1A1A] appearance-none cursor-pointer focus:outline-none focus:border-[#B8925D] focus:ring-2 focus:ring-[#B8925D]/20 transition"
          >
            <option value="london">
              London (Bloomsbury / Coram St, WC1N 1HB)
            </option>
            <option value="glasgow">Glasgow (City Centre Suites)</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666] pointer-events-none" />
        </div>
      </div>

      {/* Primary Action Button */}
      <a
        href={"/book"}
        className="w-full h-14 bg-[#B8925D] hover:bg-[#9E7B4C] active:bg-[#8A6A3F] text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 shadow-sm transition"
      >
        <span>Book Appointment</span>
        <ChevronRight className="w-5 h-5" />
      </a>

      {/* Secondary Paths */}
      <div className="grid gap-3 pt-2">
        <a
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
        </a>

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
