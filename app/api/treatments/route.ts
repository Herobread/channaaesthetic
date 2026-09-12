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

    const activeLocations = rawLocations
      .filter((l: any) => l.status === "ACTIVE")
      .map((l: any) => ({
        id: l.id,
        name: l.name || "Clinic",
        city: l.address?.locality || "",
        address: [l.address?.addressLine1, l.address?.addressLine2]
          .filter(Boolean)
          .join(", "),
      }));

    const locationsMap = new Map<string, any>(
      activeLocations.map((l: any) => [l.id, l]),
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

    // 3. Map treatments to clean frontend interface
    const items = objects
      .filter((obj: any) => {
        if (obj.type !== "ITEM" || obj.isDeleted) return false;
        const itemData = obj.itemData || {};
        const firstVariation = itemData.variations?.[0]?.itemVariationData;

        return (
          itemData.productType === "APPOINTMENTS_SERVICE" ||
          Boolean(firstVariation?.serviceDuration) ||
          firstVariation?.availableForBooking === true
        );
      })
      .map((item: any) => {
        const itemData = item.itemData || {};
        const firstVariationObj = itemData.variations?.[0];
        const variationData = firstVariationObj?.itemVariationData || {};

        const durationMs = Number(variationData.serviceDuration || 1800000);
        const durationMinutes = Math.max(
          10,
          Math.round(durationMs / (60 * 1000)),
        );

        const price = variationData.priceMoney?.amount
          ? Number(variationData.priceMoney.amount) / 100
          : 0;

        // Parse deposit tag from description (e.g. "[Deposit: £25]" or "[Deposit: 25]")
        const rawDescription = itemData.description || "";
        const depositMatch = rawDescription.match(
          /\[Deposit:\s*£?([0-9.]+)\]/i,
        );
        const deposit = depositMatch ? parseFloat(depositMatch[1]) : 0;

        // Strip the tag so users see clean description text
        const cleanDesc = rawDescription
          .replace(/\[Deposit:\s*£?[0-9.]+\]/gi, "")
          .trim();

        // Handle presentAtAllLocations flag
        const isEverywhere = Boolean(item.presentAtAllLocations);
        const locationIds: string[] = isEverywhere
          ? activeLocations.map((l: any) => l.id)
          : item.presentAtLocationIds || [];

        const locations = isEverywhere
          ? activeLocations
          : locationIds.map((id) => locationsMap.get(id)).filter(Boolean);

        const firstImageId = itemData.imageIds?.[0];
        const imageUrl = firstImageId ? imageMap.get(firstImageId) : undefined;

        return {
          id: item.id,
          variationId: firstVariationObj?.id,
          title: itemData.name || "Untitled Treatment",
          desc: cleanDesc || "Bespoke clinical treatment.",
          category: categoryMap.get(itemData.categoryId) || "General",
          durationMinutes,
          time: `${durationMinutes} mins`,
          price, // raw numeric GBP (e.g., 100)
          deposit, // raw numeric GBP (e.g., 25 or 0)
          imageUrl,
          locationIds,
          locations,
          featured: price === 0,
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
