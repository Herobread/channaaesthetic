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

    const variationId = serviceVariationIds[0];

    // 1. Fetch the variation to see if a team member is assigned
    let variationObj: any = null;
    try {
      const singleRes = await square.catalog.object.get({
        objectId: variationId,
      });
      variationObj = (singleRes as any).object;
    } catch {
      const batchRes = await (square.catalog as any).batchGet?.({
        objectIds: [variationId],
      });
      variationObj = batchRes?.objects?.[0];
    }

    const assignedStaff: string[] =
      variationObj?.itemVariationData?.teamMemberIds || [];

    // 2. Fallback to active location team members if variation lacks assigned staff
    let bookableTeamMemberIds = assignedStaff;
    if (bookableTeamMemberIds.length === 0) {
      const teamRes = await square.teamMembers.search({
        query: {
          filter: {
            status: "ACTIVE",
            locationIds: [locationId],
          },
        },
      });
      const teamMembers = (teamRes as any).teamMembers || [];
      bookableTeamMemberIds = teamMembers.map((m: any) => m.id).filter(Boolean);
    }

    // Default range: next 10 days
    const start = startAt || new Date().toISOString();
    const end =
      endAt || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Build segment filter safely
    const segmentFilter: any = {
      serviceVariationId: variationId,
    };

    if (bookableTeamMemberIds.length > 0) {
      segmentFilter.teamMemberIdFilter = {
        any: bookableTeamMemberIds,
      };
    }

    // 4. Query Square native availability
    const response = await square.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: {
            startAt: start,
            endAt: end,
          },
          locationId,
          segmentFilters: [segmentFilter],
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
