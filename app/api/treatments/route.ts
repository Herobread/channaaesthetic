import { NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";

export const dynamic = "force-dynamic";

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    // 1. Fetch active clinic locations
    const locResponse = await square.locations.list();
    const rawLocations = Array.isArray(locResponse)
      ? locResponse
      : (locResponse as any).locations || [];

    const locationsMap = new Map<string, any>(
      rawLocations
        .filter((l: any) => l.status === "ACTIVE")
        .map((l: any) => [
          l.id,
          {
            id: l.id,
            name: l.name || "Clinic",
            city: l.address?.locality || "",
            address: [l.address?.addressLine1, l.address?.addressLine2]
              .filter(Boolean)
              .join(", "),
          },
        ]),
    );

    // 2. Query Catalog with related objects (Categories & Images)
    const catalogResponse = await square.catalog.search({
      cursor,
      objectTypes: ["ITEM", "CATEGORY", "IMAGE"],
      includeRelatedObjects: true,
    });

    const objects = catalogResponse.objects || [];
    const relatedObjects = (catalogResponse as any).relatedObjects || [];
    const allObjects = [...objects, ...relatedObjects];

    const nextCursor = catalogResponse.cursor || undefined;

    // Map Category IDs to Category names
    const categoryMap = new Map<string, string>();
    // Map Image IDs to public CDN URLs
    const imageMap = new Map<string, string>();

    allObjects.forEach((obj: any) => {
      if (obj.type === "CATEGORY" && obj.categoryData?.name) {
        categoryMap.set(obj.id, obj.categoryData.name);
      }
      if (obj.type === "IMAGE" && obj.imageData?.url) {
        imageMap.set(obj.id, obj.imageData.url);
      }
    });

    // 3. Map treatments to frontend interface
    const items = objects
      .filter(
        (obj: any) =>
          obj.type === "ITEM" &&
          obj.itemData?.productType === "APPOINTMENTS_SERVICE" &&
          !obj.isDeleted,
      )
      .map((item: any) => {
        const itemData = item.itemData || {};
        const firstVariationObj = itemData.variations?.[0];
        const variationData = firstVariationObj?.itemVariationData || {};

        const durationMs = Number(variationData.serviceDuration || 1800000);
        const durationMinutes = Math.round(durationMs / (60 * 1000));

        const priceNum = variationData.priceMoney?.amount
          ? Number(variationData.priceMoney.amount) / 100
          : 0;

        const isFree = priceNum === 0;

        const locationIds: string[] = item.presentAtLocationIds || [];
        const locations = locationIds
          .map((id) => locationsMap.get(id))
          .filter(Boolean);

        // Resolve Image URL
        const firstImageId = itemData.imageIds?.[0];
        const imageUrl = firstImageId ? imageMap.get(firstImageId) : undefined;

        return {
          id: item.id,
          variationId: firstVariationObj?.id, // Essential for Bookings API availability
          title: itemData.name || "Untitled Treatment",
          desc: itemData.description || "Bespoke clinical treatment.",
          category: categoryMap.get(itemData.categoryId) || "Other",
          time: `${durationMinutes} min`,
          durationMinutes,
          price: isFree ? "Free" : `£${priceNum}`,
          priceNum,
          imageUrl,
          locationIds,
          locations,
          featured: isFree,
        };
      });

    return NextResponse.json({
      items,
      nextCursor,
      totalCount: items.length,
    });
  } catch (err: any) {
    console.error("Failed to query Square treatments:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load treatments" },
      { status: 500 },
    );
  }
}
