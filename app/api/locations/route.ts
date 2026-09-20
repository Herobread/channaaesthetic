import { square } from "@/lib/square";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const locResponse = await square.locations.list();
    const rawLocations = Array.isArray(locResponse)
      ? locResponse
      : (locResponse as any).locations || [];

    const locations = rawLocations
      .filter((l: any) => l.status === "ACTIVE")
      .map((loc: any) => ({
        id: loc.id,
        name: loc.name || "Clinic Location",
        city: loc.address?.locality || "",
        address: [loc.address?.addressLine1, loc.address?.addressLine2]
          .filter(Boolean)
          .join(", "),
        phoneNumber: loc.phoneNumber || undefined,
      }));

    return NextResponse.json(locations);
  } catch (err: any) {
    console.error("Failed to fetch Square locations:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load locations" },
      { status: 500 },
    );
  }
}
