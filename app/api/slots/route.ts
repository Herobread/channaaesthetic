import { NextResponse } from "next/server";
import { CAL_ALLOWED_DURATIONS, CAL_MIN_DURATION } from "../constants";

// app/api/slots/route.ts

function snapToCalDuration(rawMinutes?: number): number {
  if (!rawMinutes || rawMinutes <= 0) return CAL_MIN_DURATION;
  const matched = CAL_ALLOWED_DURATIONS.find((d) => d >= rawMinutes);
  return matched || 180;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventTypeId = searchParams.get("eventTypeId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const timeZone = searchParams.get("timeZone") || "Europe/London";
  const rawDuration = Number(searchParams.get("duration"));

  if (!eventTypeId || !start || !end) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Snap before requesting slots from Cal.com
  const duration = snapToCalDuration(rawDuration);

  const url = new URL("https://api.cal.com/v2/slots");
  url.searchParams.set("eventTypeId", eventTypeId);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("timeZone", timeZone);
  url.searchParams.set("duration", duration.toString());

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.CAL_API_KEY}`,
      "cal-api-version": "2024-09-04",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
