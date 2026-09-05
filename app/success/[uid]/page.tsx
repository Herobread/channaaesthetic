// app/success/[uid]/page.tsx
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  robots: { index: false, follow: false },
};

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email || "your email";
  const [user, domain] = email.split("@");
  return `${user.slice(0, 1)}***@${domain}`;
}

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  if (!uid) redirect("/book");

  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CAL_API_KEY environment variable.");
  }

  const calRes = await fetch(`https://api.cal.com/v2/bookings/${uid}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": "2024-08-13",
    },
    cache: "no-store",
  });

  if (!calRes.ok) redirect("/book");

  const bookingResponse = await calRes.json();
  const booking = bookingResponse.data || bookingResponse;

  // 1. Robust authorization check
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("booking_session")?.value;

  const isAuthorizedBooker = Boolean(
    sessionToken &&
    (String(sessionToken) === String(uid) ||
      String(sessionToken) === String(booking.uid) ||
      String(sessionToken) === String(booking.id)),
  );

  // 2. Format Dates
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

  // 3. Extract attendee email
  const rawEmail =
    booking.attendees?.[0]?.email ||
    booking.user?.email ||
    booking.responses?.email ||
    "";

  // Show the real email if authorized, masked only if unauthorized
  const displayEmail = isAuthorizedBooker
    ? rawEmail || "your email"
    : maskEmail(rawEmail);

  // 4. Extract metadata & treatments breakdown
  const metadata = booking.metadata || {};
  const notesText =
    booking.bookingFieldsResponses?.notes || booking.description || "";

  const treatmentLines: string[] = [];
  if (notesText.includes("Treatments:")) {
    const afterTreatments = notesText.split("Treatments:")[1];
    const section = afterTreatments.split("Financials:")[0];
    for (const line of section.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("•")) {
        treatmentLines.push(trimmed.replace(/^•\s*/, ""));
      }
    }
  }

  const totalPrice = metadata.totalPrice || "0";
  const totalDeposit = metadata.totalDeposit || "0";
  const balanceDue =
    metadata.balanceDue ||
    String(Math.max(0, Number(totalPrice) - Number(totalDeposit)));

  return (
    <main className="min-h-screen bg-[#141210] text-[#F5F2EB] px-4 py-12 sm:py-20">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DFC095]/10 border border-[#DFC095]/30 text-[#DFC095] mb-2">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Appointment Confirmed
          </h1>
          <p className="text-[#B8AEA4] text-sm sm:text-base max-w-md mx-auto">
            A confirmation email has been sent to{" "}
            <span className="text-[#DFC095] font-medium">{displayEmail}</span>.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1C1A18] border border-[#38332E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#38332E] pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#B8AEA4] font-semibold block">
                Booking Reference
              </span>
              <span className="text-xs font-mono text-[#DFC095] mt-0.5 block">
                {uid}
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#2A2622] text-[#DFC095] border border-[#3D3833] font-medium">
              Verified
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

          {/* Only show procedures & financial breakdown if authorized */}
          {isAuthorizedBooker ? (
            <>
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-[#B8AEA4] font-semibold">
                  Procedures Booked
                </h3>
                <div className="divide-y divide-[#38332E] bg-[#24211E] border border-[#38332E] rounded-2xl px-4">
                  {treatmentLines.length > 0 ? (
                    treatmentLines.map((line, idx) => (
                      <div
                        key={idx}
                        className="py-3.5 text-sm font-medium text-white"
                      >
                        {line}
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
            </>
          ) : (
            <div className="bg-[#24211E] border border-[#38332E] rounded-2xl p-4 text-center text-xs text-[#B8AEA4]">
              Itemized procedure details and pricing are hidden for patient
              privacy. Please check your confirmation email for full
              consultation records.
            </div>
          )}
        </div>

        {/* Guidance */}
        <div className="bg-[#24211E]/70 border border-[#38332E] rounded-2xl p-5 flex items-start gap-3.5 text-xs sm:text-sm text-[#B8AEA4]">
          <ShieldCheck className="w-5 h-5 text-[#DFC095] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white mb-1">
              Pre-Appointment Instructions
            </p>
            <p className="leading-relaxed">
              Please avoid blood-thinning agents, alcohol, and active skincare
              ingredients 24-48 hours before your session.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#B8925D] hover:bg-[#A8824C] text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <span>Return to Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
