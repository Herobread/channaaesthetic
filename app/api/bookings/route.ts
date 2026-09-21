import { square } from "@/lib/square";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
      services,
      customer,
      notes,
      sourceId,
      depositAmount,
    } = await request.json();

    if (!locationId || !startAt || !customer?.email) {
      return NextResponse.json(
        { error: "Missing required booking details." },
        { status: 400 },
      );
    }

    // Extract all requested variation IDs
    const rawServices: { variationId: string }[] =
      Array.isArray(services) && services.length > 0
        ? services
        : serviceVariationId
          ? [{ variationId: serviceVariationId }]
          : [];

    if (rawServices.length === 0) {
      return NextResponse.json(
        { error: "At least one clinical treatment variation is required." },
        { status: 400 },
      );
    }

    const variationIds = rawServices.map((s) => s.variationId);
    const primaryVariationId = variationIds[0];

    // 1. PRE-FLIGHT AVAILABILITY CHECK
    const startWindow = new Date(
      new Date(startAt).getTime() - 60000,
    ).toISOString();
    const endWindow = new Date(
      new Date(startAt).getTime() + 60000,
    ).toISOString();

    const availRes = await (square.bookings as any).searchAvailability({
      query: {
        filter: {
          startAtRange: { startAt: startWindow, endAt: endWindow },
          locationId,
          segmentFilters: [{ serviceVariationId: primaryVariationId }],
        },
      },
    });

    const isAvailable = availRes.availabilities?.some(
      (a: any) => new Date(a.startAt).getTime() === new Date(startAt).getTime(),
    );

    if (!isAvailable) {
      return NextResponse.json(
        {
          error:
            "This appointment slot was just secured by another client. Please select another time.",
        },
        { status: 409 },
      );
    }

    // 2. SERVER-SIDE DEPOSIT VERIFICATION (Anti-tamper)
    let catalogObjects: any[] = [];
    try {
      const batchRes = await (square.catalog as any).batchGet?.({
        objectIds: variationIds,
      });
      catalogObjects = batchRes?.objects || [];
    } catch {
      const singleRes = await square.catalog.object.get({
        objectId: primaryVariationId,
      });
      if ((singleRes as any).object) {
        catalogObjects = [(singleRes as any).object];
      }
    }

    let bookingPolicy: any = null;
    try {
      const locPolicyRes = await (
        square.bookings as any
      ).retrieveLocationBookingProfile({ locationId });
      bookingPolicy = locPolicyRes?.locationBookingProfile;
      if (!bookingPolicy) {
        const bizPolicyRes = await (
          square.bookings as any
        ).retrieveBusinessBookingProfile();
        bookingPolicy = bizPolicyRes?.businessBookingProfile;
      }
    } catch (policyErr) {
      console.warn(
        "Could not retrieve Square Booking Profile policy:",
        policyErr,
      );
    }

    const policyRequirement =
      bookingPolicy?.bookingPolicy || bookingPolicy?.booking_policy;
    const settings =
      bookingPolicy?.depositSettings || bookingPolicy?.deposit_settings;
    const depositPercentage =
      settings?.percentage || settings?.deposit_percentage;
    const depositFixed =
      settings?.fixedAmountMoney?.amount ||
      settings?.fixed_amount_money?.amount;

    const calculateExpectedDeposit = (price: number) => {
      if (policyRequirement === "REQUIRE_FULL_PAYMENT") return price;
      if (policyRequirement === "REQUIRE_DEPOSIT" || Boolean(settings)) {
        if (depositPercentage) {
          const pct =
            Number(depositPercentage) > 1
              ? Number(depositPercentage) / 100
              : Number(depositPercentage);
          return Math.round(price * pct * 100) / 100;
        }
        if (depositFixed) {
          return Math.min(Number(depositFixed) / 100, price);
        }
        return Math.min(30, price);
      }
      return price > 0 ? Math.min(30, price) : 0;
    };

    let serverCalculatedDeposit = 0;
    variationIds.forEach((vId) => {
      const matched = catalogObjects.find((obj) => obj.id === vId);
      const priceMoney =
        matched?.itemVariationData?.priceMoney ||
        matched?.item_variation_data?.price_money;
      const price = priceMoney?.amount ? Number(priceMoney.amount) / 100 : 0;
      serverCalculatedDeposit += calculateExpectedDeposit(price);
    });

    const clientReportedDeposit = Number(depositAmount) || 0;
    if (
      serverCalculatedDeposit > 0 &&
      clientReportedDeposit < serverCalculatedDeposit
    ) {
      return NextResponse.json(
        {
          error: `Deposit discrepancy detected. Expected £${serverCalculatedDeposit.toFixed(2)}, received £${clientReportedDeposit.toFixed(2)}.`,
        },
        { status: 400 },
      );
    }

    const finalDeposit = Math.max(
      serverCalculatedDeposit,
      clientReportedDeposit,
    );
    if (finalDeposit > 0 && !sourceId) {
      return NextResponse.json(
        { error: "A valid card token is required to cover the deposit." },
        { status: 400 },
      );
    }

    // 3. RESOLVE OR CREATE SQUARE CUSTOMER
    const emailClean = customer.email.trim().toLowerCase();
    const phoneClean = sanitizePhoneNumber(customer.phone);

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

    // 4. RESOLVE PRACTITIONER (TEAM MEMBER)
    const primaryObj = catalogObjects.find(
      (obj) => obj.id === primaryVariationId,
    );
    let teamMemberId =
      primaryObj?.itemVariationData?.teamMemberIds?.[0] ||
      primaryObj?.item_variation_data?.team_member_ids?.[0];

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

    // 5. CHARGE DEPOSIT ORDER
    if (finalDeposit > 0 && sourceId) {
      depositPence = BigInt(Math.round(finalDeposit * 100));

      const serviceTitle =
        primaryObj?.itemVariationData?.name ||
        primaryObj?.item_variation_data?.name
          ? `${primaryObj?.itemVariationData?.name || primaryObj?.item_variation_data?.name} - Deposit`
          : "Treatment Deposit";

      const orderRes = await square.orders.create({
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId,
          customerId,
          lineItems: [
            {
              name: serviceTitle,
              quantity: "1",
              basePriceMoney: {
                amount: depositPence,
                currency: "GBP",
              },
            },
          ],
        },
      });

      const paymentRes = await square.payments.create({
        sourceId,
        idempotencyKey: crypto.randomUUID(),
        amountMoney: {
          amount: depositPence,
          currency: "GBP",
        },
        orderId: (orderRes as any).order?.id,
        customerId,
        locationId,
        note: `Deposit for booking: ${customer.name || "Client"}`,
        autocomplete: true,
      });

      capturedPaymentId = (paymentRes as any).payment?.id;
    }

    // 6. BUILD SEGMENTS (Omit duration overrides to let Square deduce valid durations)
    const appointmentSegments = variationIds.map((vId) => ({
      serviceVariationId: vId,
      teamMemberId,
    }));

    const depositNotice = capturedPaymentId
      ? `NON-REFUNDABLE DEPOSIT PAID: £${finalDeposit.toFixed(2)} (Payment ID: ${capturedPaymentId})`
      : undefined;

    const bookingRes = await square.bookings.create({
      idempotencyKey: crypto.randomUUID(),
      booking: {
        locationId,
        customerId,
        startAt,
        customerNote: notes?.trim() || undefined,
        sellerNote: depositNotice,
        appointmentSegments,
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

    // ATOMIC SAFETY REVERSAL
    if (capturedPaymentId && depositPence > BigInt(0)) {
      try {
        console.warn(
          `Reversing payment ${capturedPaymentId} after failed booking commit`,
        );
        await (square.refunds as any).refundPayment({
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
        console.error("Critical: Automatic refund failed:", refundErr);
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
