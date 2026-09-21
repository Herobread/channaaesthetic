import { square } from "@/lib/square";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    // 1. Fetch catalog variation details in batch to inspect assigned practitioners
    let variationObjects: any[] = [];
    try {
      const batchRes = await (square.catalog as any).batchGet?.({
        objectIds: serviceVariationIds,
      });
      variationObjects = batchRes?.objects || [];
    } catch {
      const singleRes = await square.catalog.object.get({
        objectId: serviceVariationIds[0],
      });
      if ((singleRes as any).object) {
        variationObjects = [(singleRes as any).object];
      }
    }

    // 2. Resolve active bookable team members at this clinic location
    const teamRes = await square.teamMembers.search({
      query: {
        filter: {
          status: "ACTIVE",
          locationIds: [locationId],
        },
      },
    });
    const activeStaffIds =
      (teamRes as any).teamMembers?.map((m: any) => m.id).filter(Boolean) || [];

    // 3. Build multi-segment filters so Square searches for contiguous time slots
    const segmentFilters = serviceVariationIds.map((vId: string) => {
      const matchedObj = variationObjects.find((obj) => obj.id === vId);
      const assignedStaff: string[] =
        matchedObj?.itemVariationData?.teamMemberIds ||
        matchedObj?.item_variation_data?.team_member_ids ||
        [];

      // Prefer assigned staff; fallback to all active staff at location
      const eligibleStaff =
        assignedStaff.length > 0 ? assignedStaff : activeStaffIds;

      const filter: any = {
        serviceVariationId: vId,
      };

      if (eligibleStaff.length > 0) {
        filter.teamMemberIdFilter = {
          any: eligibleStaff,
        };
      }

      return filter;
    });

    // Default range: next 10 days
    const start = startAt || new Date().toISOString();
    const end =
      endAt || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Query Square native availability with all segments
    const response = await square.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: {
            startAt: start,
            endAt: end,
          },
          locationId,
          segmentFilters,
        },
      },
    });

    const availabilities = (response as any).availabilities || [];

    const slots = availabilities.map((avail: any) => ({
      start: avail.startAt,
      teamMemberId: avail.appointmentSegments?.[0]?.teamMemberId,
    }));

    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error("Square /api/slots error:", err);
    const detail =
      err?.errors?.[0]?.detail ||
      err?.body?.errors?.[0]?.detail ||
      err?.message ||
      "Failed to search availability";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
