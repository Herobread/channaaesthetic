// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { CAL_ALLOWED_DURATIONS, CAL_MIN_DURATION } from "../constants";

function snapToCalDuration(rawMinutes?: number): number {
  if (!rawMinutes || rawMinutes <= 0) return CAL_MIN_DURATION;
  const matched = CAL_ALLOWED_DURATIONS.find((d) => d >= rawMinutes);
  return matched || 180;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      start,
      eventTypeId,
      duration,
      name,
      email,
      phoneNumber,
      notes, // Extracted from client form
      locationAddress,
      cart = [],
      totalPrice = 0,
      totalDeposit = 0,
    } = body;

    if (!start || !eventTypeId || !name || !email) {
      return NextResponse.json(
        {
          error:
            "Missing required booking details (start, eventTypeId, name, email)",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.CAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CAL_API_KEY environment variable is missing" },
        { status: 500 },
      );
    }

    const validLength = snapToCalDuration(Number(duration));

    const treatmentsList =
      Array.isArray(cart) && cart.length > 0
        ? cart
            .map(
              (i: any) =>
                `• ${i.quantity > 1 ? `${i.quantity}x ` : ""}${i.treatment?.title || "Treatment"} (${i.treatment?.time || "N/A"})`,
            )
            .join("\n")
        : "• General Appointment";

    const balanceDue = Math.max(0, Number(totalPrice) - Number(totalDeposit));

    // Combines the automated cart summary with the patient's clinical note
    const summaryNotes = `
CLINIC ORDER SUMMARY
----------------------------------
Treatments:
${treatmentsList}

Financials:
• Total Procedure Cost: £${totalPrice}
• Deposit Due / Paid: £${totalDeposit}
• Balance Due at Clinic: £${balanceDue}
----------------------------------
Phone: ${phoneNumber || "N/A"}
${notes ? `\nPATIENT NOTES:\n${notes.trim()}\n` : ""}
`.trim();

    const payload: Record<string, any> = {
      start,
      eventTypeId: Number(eventTypeId),
      lengthInMinutes: validLength,
      attendee: {
        name,
        email,
        timeZone: "Europe/London",
        phoneNumber: phoneNumber || undefined,
      },
      bookingFieldsResponses: {
        notes: summaryNotes,
      },
      metadata: {
        summary: summaryNotes,
        patientNotes: notes ? String(notes).trim() : "",
        totalPrice: String(totalPrice),
        totalDeposit: String(totalDeposit),
        treatmentCount: String(cart.length),
      },
    };

    if (locationAddress) {
      payload.location = locationAddress;
    }

    const res = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cal.com Booking Error:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error?.message ||
            "Failed to create booking on Cal.com",
          details: data,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Internal Booking Exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
