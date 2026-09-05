// app/api/bookings/[uid]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uid: string }> | { uid: string } },
) {
  const resolvedParams = await params;
  const uid = resolvedParams.uid;
  const apiKey = process.env.CAL_API_KEY;

  if (!apiKey || !uid) {
    return NextResponse.json(
      { error: "Unauthorized or missing UID" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`https://api.cal.com/v2/bookings/${uid}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2024-08-13",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Booking not found" },
        { status: res.status },
      );
    }

    return NextResponse.json(data.data || data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
