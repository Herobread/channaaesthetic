// app/book/success/page.tsx
"use client";

import {
  AlertCircle,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ParsedTreatment {
  title: string;
  price?: string;
  duration?: string;
}

function parseTreatmentsFromNotes(notesText?: string): ParsedTreatment[] {
  if (!notesText) return [];
  const results: ParsedTreatment[] = [];

  const lines = notesText.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("•")) {
      const content = trimmed.replace(/^•\s*/, "");
      if (
        content.toLowerCase().startsWith("total") ||
        content.toLowerCase().startsWith("deposit") ||
        content.toLowerCase().startsWith("balance")
      ) {
        continue;
      }
      results.push({ title: content });
    }
  }

  return results;
}

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setError("No booking reference provided.");
      setLoading(false);
      return;
    }

    async function verifyBooking() {
      try {
        const res = await fetch(`/api/bookings/${ref}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Could not verify booking.");
        }

        setBooking(data);
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    }

    verifyBooking();
  }, [ref]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#141210] text-[#F5F2EB] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#DFC095]" />
        <p className="text-[#B8AEA4] text-sm">
          Verifying appointment with clinic...
        </p>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-[#141210] text-[#F5F2EB] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="bg-[#2B1414] border border-red-900/60 p-6 rounded-2xl max-w-md text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Booking Verification</h2>
          <p className="text-sm text-red-200">
            {error || "Unable to find booking details."}
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#B8925D] hover:bg-[#A8824C] text-white text-sm font-semibold transition"
            >
              Start New Reservation
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const dateObj = new Date(booking.start);
  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const metadata = booking.metadata || {};
  const notesText =
    booking.bookingFieldsResponses?.notes || booking.description || "";

  const treatments = parseTreatmentsFromNotes(notesText);
  const totalPrice = metadata.totalPrice || "0";
  const totalDeposit = metadata.totalDeposit || "0";
  const balanceDue =
    metadata.balanceDue ||
    String(Math.max(0, Number(totalPrice) - Number(totalDeposit)));

  const attendeeEmail =
    booking.attendees?.[0]?.email ||
    booking.user?.email ||
    "your registered email";

  return (
    <main className="min-h-screen bg-[#141210] text-[#F5F2EB] px-4 py-12 sm:py-20">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DFC095]/10 border border-[#DFC095]/30 text-[#DFC095] mb-2">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
            Appointment Confirmed
          </h1>
          <p className="text-[#B8AEA4] text-sm sm:text-base max-w-md mx-auto">
            A confirmation email and calendar invitation has been sent to{" "}
            <span className="text-[#DFC095] font-medium underline">
              {attendeeEmail}
            </span>
            .
          </p>
        </div>

        <div className="bg-[#1C1A18] border border-[#38332E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#38332E] pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#B8AEA4] font-semibold block">
                Booking Reference
              </span>
              <span className="text-xs font-mono text-[#DFC095] mt-0.5 block">
                {ref}
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#2A2622] text-[#DFC095] border border-[#3D3833] font-medium">
              Verified Order
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-[#24211E] p-4 rounded-2xl border border-[#38332E]">
              <CalendarIcon className="w-5 h-5 text-[#DFC095] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#B8AEA4]">Date &amp; Time</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {formattedDate}
                </p>
                <p className="text-xs text-[#DFC095] font-medium mt-0.5">
                  {formattedTime} (
                  {booking.duration || booking.lengthInMinutes || 60} mins)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#24211E] p-4 rounded-2xl border border-[#38332E]">
              <MapPin className="w-5 h-5 text-[#DFC095] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#B8AEA4]">Clinic Location</p>
                <p className="text-sm font-semibold text-white mt-0.5 line-clamp-2">
                  {booking.location || "Clinic Location"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-[#B8AEA4] font-semibold">
              Procedures Booked
            </h3>
            <div className="divide-y divide-[#38332E] bg-[#24211E] border border-[#38332E] rounded-2xl px-4">
              {treatments.length > 0 ? (
                treatments.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-sm text-[#B8AEA4]">
                  Clinical Consultation Session
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#24211E] border border-[#38332E] rounded-2xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-[#B8AEA4]">
              <span>Total Procedure Value</span>
              <span>£{totalPrice}</span>
            </div>
            <div className="flex justify-between text-[#DFC095] font-medium">
              <span>Deposit Recorded</span>
              <span>£{totalDeposit}</span>
            </div>
            <div className="border-t border-[#38332E] pt-2.5 flex justify-between font-bold text-white text-base">
              <span>Balance Due at Clinic</span>
              <span>£{balanceDue}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#24211E]/70 border border-[#38332E] rounded-2xl p-5 flex items-start gap-3.5 text-xs sm:text-sm text-[#B8AEA4]">
          <ShieldCheck className="w-5 h-5 text-[#DFC095] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white mb-1">
              Pre-Appointment Instructions
            </p>
            <p className="leading-relaxed">
              Please avoid blood-thinning agents, alcohol, and active skincare
              ingredients 24-48 hours before your session. Arrive 10 minutes
              prior to your allocated slot.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#B8925D] hover:bg-[#A8824C] text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <span>Return to Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/book"
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#2A2622] hover:bg-[#38332E] text-[#E6E0D8] border border-[#3D3833] text-sm font-medium flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-[#DFC095]" />
            <span>Book Another Service</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
