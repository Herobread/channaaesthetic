import { NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export async function POST(request: Request) {
  try {
    const { locationId, serviceVariationIds, startAt, endAt } =
      await request.json();

    if (!locationId || !serviceVariationIds || !serviceVariationIds.length) {
      return NextResponse.json(
        { error: "locationId and serviceVariationIds are required" },
        { status: 400 },
      );
    }

    // Default range: next 10 days if not provided
    const start = startAt || new Date().toISOString();
    const end =
      endAt || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    // Map each item variation into an appointment segment
    const appointmentSegments = serviceVariationIds.map(
      (variationId: string) => ({
        serviceVariationId: variationId,
        serviceVariationVersion: BigInt(1), // Square will auto-resolve if null or default
      }),
    );

    // Query Square's native Bookings engine
    const response = await square.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: {
            startAt: start,
            endAt: end,
          },
          locationId,
          segmentFilters: [
            {
              serviceVariationId: serviceVariationIds[0],
            },
          ],
        },
      },
    });

    const availabilities = (response as any).availabilities || [];

    // Format into flat start times
    const slots = availabilities.map((avail: any) => ({
      start: avail.startAt,
      teamMemberId: avail.appointmentSegments?.[0]?.teamMemberId,
    }));

    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error("Square availability error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to search availability" },
      { status: 500 },
    );
  }
}
