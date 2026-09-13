import { NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

/**
 * Formats incoming UK/international phone strings to E.164 standard required by Square.
 */
function sanitizePhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("07") && cleaned.length === 11) {
    return `+44${cleaned.slice(1)}`;
  }
  if (!cleaned.startsWith("+") && cleaned.length >= 10) {
    return `+${cleaned}`;
  }
  return cleaned || undefined;
}

export async function POST(request: Request) {
  let capturedPaymentId: string | null = null;
  let depositPence = BigInt(0);

  try {
    const {
      locationId,
      startAt,
      serviceVariationId,
      customer,
      notes,
      sourceId, // Card token from Square Web Payments SDK
      depositAmount, // Numeric deposit amount in GBP (e.g., 25)
    } = await request.json();

    if (!locationId || !startAt || !serviceVariationId || !customer?.email) {
      return NextResponse.json(
        { error: "Missing required booking details." },
        { status: 400 },
      );
    }

    const numericDeposit = Number(depositAmount) || 0;
    if (numericDeposit > 0 && !sourceId) {
      return NextResponse.json(
        { error: "A valid payment card is required to cover the deposit." },
        { status: 400 },
      );
    }

    const emailClean = customer.email.trim().toLowerCase();
    const phoneClean = sanitizePhoneNumber(customer.phone);

    // 1. Find or create customer
    let customerId: string;
    const searchRes = await square.customers.search({
      query: { filter: { emailAddress: { exact: emailClean } } },
    });
    const existing = (searchRes as any).customers?.[0];

    if (existing) {
      customerId = existing.id;
    } else {
      const [givenName, ...rest] = (customer.name || "Guest").trim().split(" ");
      const familyName = rest.join(" ") || "";
      const created = await square.customers.create({
        idempotencyKey: crypto.randomUUID(),
        givenName,
        familyName,
        emailAddress: emailClean,
        phoneNumber: phoneClean,
        note: notes?.trim() || undefined,
      });
      customerId = (created as any).customer.id;
    }

    // 2. Charge non-refundable deposit if required
    if (numericDeposit > 0 && sourceId) {
      depositPence = BigInt(Math.round(numericDeposit * 100));

      const paymentRes = await square.payments.create({
        sourceId,
        idempotencyKey: crypto.randomUUID(),
        amountMoney: {
          amount: depositPence,
          currency: "GBP",
        },
        customerId,
        locationId,
        note: `Deposit: ${customer.name || "Client"} - Non-refundable`,
      });

      capturedPaymentId = (paymentRes as any).payment?.id;
    }

    // 3. Resolve service variation & team member
    let variationObj: any = null;
    try {
      const singleRes = await square.catalog.object.get({
        objectId: serviceVariationId,
      });
      variationObj = (singleRes as any).object;
    } catch {
      const batchRes = await (square.catalog as any).batchGet?.({
        objectIds: [serviceVariationId],
      });
      variationObj = batchRes?.objects?.[0];
    }

    const variationVersion = variationObj?.version
      ? BigInt(variationObj.version)
      : BigInt(1);
    let teamMemberId = variationObj?.itemVariationData?.teamMemberIds?.[0];

    if (!teamMemberId) {
      const teamRes = await square.teamMembers.search({
        query: { filter: { status: "ACTIVE", locationIds: [locationId] } },
      });
      teamMemberId = (teamRes as any).teamMembers?.[0]?.id;
    }

    if (!teamMemberId) {
      throw new Error(
        "No active bookable practitioner found for this location.",
      );
    }

    // 4. Create Booking
    const bookingNote = [
      notes?.trim(),
      capturedPaymentId
        ? `Non-refundable deposit paid: £${numericDeposit} (Payment ID: ${capturedPaymentId})`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const bookingRes = await square.bookings.create({
      idempotencyKey: crypto.randomUUID(),
      booking: {
        locationId,
        customerId,
        startAt,
        customerNote: bookingNote || undefined,
        appointmentSegments: [
          {
            serviceVariationId,
            serviceVariationVersion: variationVersion,
            teamMemberId,
          },
        ],
      },
    });

    const booking = (bookingRes as any).booking;

    const serializedBooking = JSON.parse(
      JSON.stringify(booking, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    const response = NextResponse.json({
      success: true,
      booking: serializedBooking,
    });

    response.cookies.set("booking_session", serializedBooking.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err: any) {
    console.error("Square Booking/Payment Error:", err);

    // Rollback: Void/refund payment if booking creation failed after charge
    if (capturedPaymentId && depositPence > BigInt(0)) {
      try {
        console.warn(
          `Attempting automatic refund for failed booking on payment ${capturedPaymentId}`,
        );
        await square.refunds.createPaymentRefund({
          idempotencyKey: crypto.randomUUID(),
          paymentId: capturedPaymentId,
          amountMoney: {
            amount: depositPence,
            currency: "GBP",
          },
          reason:
            "System refund: Appointment creation failed after deposit capture.",
        });
      } catch (refundErr) {
        console.error(
          "Critical: Automatic refund failed. Check Square Dashboard:",
          refundErr,
        );
      }
    }

    const msg =
      err?.errors?.[0]?.detail ||
      err?.body?.errors?.[0]?.detail ||
      err?.message ||
      "Failed to process deposit and booking";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
