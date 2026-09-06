// app/success/page.tsx
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessHandoff({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/book");
  }

  // 1. Fetch the Stripe session
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const meta = session.metadata;

  if (!meta) {
    redirect("/book");
  }

  // 🚨 CRITICAL SECURITY FIX: Verify actual payment 🚨
  if (session.payment_status !== "paid") {
    // If they abandoned checkout or the card declined, kick them out
    redirect("/book/datetime?error=payment_incomplete");
  }

  // 2. Book into Cal.com API v2 directly
  const calRes = await fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CAL_API_KEY}`,
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify({
      start: new Date(meta.slot).toISOString(),
      eventTypeId: Number(meta.eventTypeId),
      attendee: {
        name: meta.name,
        email: meta.email,
        timeZone: "Europe/London",
        phoneNumber: meta.phone || undefined,
        language: "en",
      },
      location: meta.locationAddress || undefined,
      bookingFieldsResponses: {
        notes: `Treatments: ${meta.treatmentBreakdown} | Deposit: £${(session.amount_total || 0) / 100}`,
        ...(meta.phone ? { phone: meta.phone } : {}),
      },
      metadata: {
        stripeSessionId: session_id,
      },
    }),
  });

  const calData = await calRes.json();
  const uid = calData.data?.uid || calData.uid || "confirmed";

  // 3. Immediately route the user to your final URL structure
  redirect(`/success/${uid}`);
}
