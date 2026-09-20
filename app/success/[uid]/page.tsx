// app/success/[uid]/page.tsx
import { square } from "@/lib/square";

import HistoryReset from "@/components/shared/HistoryReset";
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

  let booking: any = null;
  let customer: any = null;
  let location: any = null;

  try {
    // 1. Fetch booking record from Square
    const bookingRes = await square.bookings.get({ bookingId: uid });
    booking = (bookingRes as any).booking;

    if (!booking) redirect("/book");

    // 2. Fetch Customer Details
    if (booking.customerId) {
      try {
        const customerRes = await square.customers.get({
          customerId: booking.customerId,
        });
        customer = (customerRes as any).customer;
      } catch (e) {
        console.warn("Could not fetch customer details for booking:", uid);
      }
    }

    // 3. Fetch Clinic Location Name & Address
    if (booking.locationId) {
      try {
        const locRes = await square.locations.get({
          locationId: booking.locationId,
        });
        location = (locRes as any).location;
      } catch (e) {
        console.warn("Could not fetch location for booking:", uid);
      }
    }
  } catch (err) {
    console.error("Square booking retrieval failed:", err);
    redirect("/book");
  }

  // 4. Authorization check against session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("booking_session")?.value;

  const isAuthorizedBooker = Boolean(
    sessionToken &&
    (String(sessionToken) === String(uid) ||
      String(sessionToken) === String(booking?.id) ||
      String(sessionToken) === String(booking?.customerId)),
  );

  // 5. Format Appointment Date & Duration
  const startDate = booking.startAt ? new Date(booking.startAt) : new Date();
  const formattedDate = startDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate total duration across appointment segments
  const segments = booking.appointmentSegments || [];
  const durationMinutes =
    segments.reduce(
      (acc: number, seg: any) => acc + (seg.durationMinutes || 0),
      0,
    ) || 45;

  const rawEmail = customer?.emailAddress || "";
  const displayEmail = isAuthorizedBooker
    ? rawEmail || "your email"
    : maskEmail(rawEmail);

  // 6. Clinic Address Formatting
  const locationAddress = location?.address
    ? [
        location.address.addressLine1,
        location.address.locality,
        location.address.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : location?.name || "Clinic Location";

  return (
    <main className="min-h-screen bg-[#141210] text-[#F5F2EB] px-4 py-12 sm:py-20">
      <HistoryReset />
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
                Square Booking ID
              </span>
              <span className="text-xs font-mono text-[#DFC095] mt-0.5 block">
                {uid}
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#2A2622] text-[#DFC095] border border-[#3D3833] font-medium">
              {booking.status || "ACCEPTED"}
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
                  {formattedTime} ({durationMinutes} mins)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#24211E] p-4 rounded-2xl border border-[#38332E]">
              <MapPin className="w-5 h-5 text-[#DFC095] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#B8AEA4]">Clinic Location</p>
                <p className="text-sm font-semibold text-white mt-0.5 line-clamp-2">
                  {locationAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Procedure Notes & Privacy Gating */}
          {isAuthorizedBooker ? (
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-[#B8AEA4] font-semibold">
                Clinical Notes
              </h3>
              <div className="bg-[#24211E] border border-[#38332E] rounded-2xl p-4 text-xs text-[#B8AEA4]">
                {booking.customerNote ? (
                  <p>{booking.customerNote}</p>
                ) : (
                  <p className="italic">No special medical notes provided.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#24211E] border border-[#38332E] rounded-2xl p-4 text-center text-xs text-[#B8AEA4]">
              Itemized procedure details are hidden for patient privacy. Please
              check your confirmation email for full clinical records.
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
              ingredients (retinoids, AHA/BHA) 24-48 hours before your session.
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
