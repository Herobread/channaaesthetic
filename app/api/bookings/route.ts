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
  try {
    const { locationId, startAt, serviceVariationId, customer, notes } =
      await request.json();

    if (!locationId || !startAt || !serviceVariationId || !customer?.email) {
      return NextResponse.json(
        { error: "Missing required booking details." },
        { status: 400 },
      );
    }

    const emailClean = customer.email.trim().toLowerCase();
    const phoneClean = sanitizePhoneNumber(customer.phone);

    // 1. Find existing customer or create a new one
    let customerId: string;
    const searchRes = await square.customers.search({
      query: {
        filter: {
          emailAddress: {
            exact: emailClean,
          },
        },
      },
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

    // 2. Retrieve service variation details to read version & assigned staff
    let variationObj: any = null;

    try {
      const singleRes = await square.catalog.object.get({
        objectId: serviceVariationId,
      });
      variationObj = (singleRes as any).object;
    } catch {
      // Fallback if object.get is unavailable
      const batchRes = await (square.catalog as any).batchGet?.({
        objectIds: [serviceVariationId],
      });
      variationObj = batchRes?.objects?.[0];
    }

    const variationVersion = variationObj?.version
      ? BigInt(variationObj.version)
      : BigInt(1);

    // 3. Extract assigned staff member from variation or active team members
    let teamMemberId = variationObj?.itemVariationData?.teamMemberIds?.[0];

    if (!teamMemberId) {
      const teamRes = await square.teamMembers.search({
        query: {
          filter: {
            status: "ACTIVE",
            locationIds: [locationId],
          },
        },
      });

      teamMemberId = (teamRes as any).teamMembers?.[0]?.id;
    }

    if (!teamMemberId) {
      return NextResponse.json(
        { error: "No active bookable team member found for this location." },
        { status: 400 },
      );
    }

    // 4. Create the booking in Square Appointments
    const bookingRes = await square.bookings.create({
      idempotencyKey: crypto.randomUUID(),
      booking: {
        locationId,
        customerId,
        startAt,
        customerNote: notes?.trim() || undefined,
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

    // Convert BigInts before JSON serialization
    const serializedBooking = JSON.parse(
      JSON.stringify(booking, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    // 5. Build response & set authentication cookie for the /success/[uid] page
    const response = NextResponse.json({
      success: true,
      booking: serializedBooking,
    });

    response.cookies.set("booking_session", serializedBooking.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: any) {
    console.error("Square Booking Error:", err);

    // Parse Square structured error details if available
    const squareMessage =
      err?.errors?.[0]?.detail ||
      err?.body?.errors?.[0]?.detail ||
      err?.message ||
      "Failed to finalize booking";

    return NextResponse.json({ error: squareMessage }, { status: 500 });
  }
}
