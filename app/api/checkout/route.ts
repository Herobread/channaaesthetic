// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      totalDeposit,
      customerDetails,
      selectedSlot,
      eventTypeId,
      cart,
      locationAddress,
    } = body;

    // Detect exact protocol and host directly from request headers
    const host = req.headers.get("host") || "localhost:3000";
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `${proto}://${host}`;

    const treatmentNames = (cart || [])
      .map(
        (item: any) =>
          `${item.quantity}x ${item.treatment?.title || "Treatment"}`,
      )
      .join(", ");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerDetails.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Treatment Reservation Deposit",
              description: treatmentNames || "Salon Appointment",
            },
            unit_amount: Math.round(Number(totalDeposit) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        slot: selectedSlot,
        eventTypeId: String(eventTypeId),
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        notes: customerDetails.notes || "",
        treatmentBreakdown: treatmentNames,
        locationAddress: locationAddress || "",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book/details`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe session creation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
