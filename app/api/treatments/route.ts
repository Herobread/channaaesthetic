// app/api/treatments/route.ts
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

    const primaryLocationId = activeLocations[0]?.id;

    // 2. Fetch Square Booking Policy settings directly from Square
    let bookingPolicy: any = null;
    try {
      if (primaryLocationId) {
        const locPolicyRes = await (
          square.bookings as any
        ).retrieveLocationBookingProfile({
          locationId: primaryLocationId,
        });
        bookingPolicy = locPolicyRes?.locationBookingProfile;
      }

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

    // 3. Query Catalog Items, Categories & Images
    const catalogResponse = await square.catalog.search({
      cursor,
      objectTypes: ["ITEM", "CATEGORY", "IMAGE"],
      includeRelatedObjects: true,
    });

    const objects = catalogResponse.objects || [];
    const relatedObjects = (catalogResponse as any).relatedObjects || [];
    const allObjects = [...objects, ...relatedObjects];
    const nextCursor = catalogResponse.cursor || undefined;

    const categoryMap = new Map<string, string>();
    const imageMap = new Map<string, string>();

    allObjects.forEach((obj: any) => {
      if (obj.type === "CATEGORY" && obj.categoryData?.name) {
        categoryMap.set(obj.id, obj.categoryData.name);
      }
      if (obj.type === "IMAGE" && obj.imageData?.url) {
        imageMap.set(obj.id, obj.imageData.url);
      }
    });

    // 4. Map treatments and calculate deposit strictly using Square's Policy Profile
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

        const durationMs = Number(variationData.serviceDuration || 2700000);
        const durationMinutes = Math.max(
          10,
          Math.round(durationMs / (60 * 1000)),
        );

        const price = variationData.priceMoney?.amount
          ? Number(variationData.priceMoney.amount) / 100
          : 0;

        // Extract deposit rules configured in Square's booking policy profile
        let deposit = 0;
        const policyRequirement =
          bookingPolicy?.bookingPolicy || bookingPolicy?.booking_policy;

        // Check if Square policy requires upfront payment or deposit
        if (policyRequirement === "REQUIRE_FULL_PAYMENT") {
          deposit = price;
        } else if (
          policyRequirement === "REQUIRE_DEPOSIT" ||
          bookingPolicy?.depositSettings ||
          bookingPolicy?.deposit_settings
        ) {
          const settings =
            bookingPolicy?.depositSettings || bookingPolicy?.deposit_settings;
          const depositPercentage =
            settings?.percentage || settings?.deposit_percentage;
          const depositFixed =
            settings?.fixedAmountMoney?.amount ||
            settings?.fixed_amount_money?.amount;

          if (depositPercentage) {
            const pct =
              Number(depositPercentage) > 1
                ? Number(depositPercentage) / 100
                : Number(depositPercentage);
            deposit = Math.round(price * pct * 100) / 100;
          } else if (depositFixed) {
            deposit = Math.min(Number(depositFixed) / 100, price);
          } else {
            deposit = Math.min(30, price);
          }
        } else {
          // If the profile sets card authorization or hold, use policy minimum or full price
          deposit = price > 0 ? Math.min(30, price) : 0;
        }

        const isEverywhere = Boolean(item.presentAtAllLocations);
        const locationIds: string[] = isEverywhere
          ? activeLocations.map((l: any) => l.id)
          : item.presentAtLocationIds || [];

        const locations = isEverywhere
          ? activeLocations
          : locationIds
              .map((id) => activeLocations.find((l: any) => l.id === id))
              .filter(Boolean);

        const firstImageId = itemData.imageIds?.[0];
        const imageUrl = firstImageId ? imageMap.get(firstImageId) : undefined;

        return {
          id: item.id,
          variationId: firstVariationObj?.id,
          title: itemData.name || "Untitled Treatment",
          desc: itemData.description || "Bespoke clinical treatment.",
          category: categoryMap.get(itemData.categoryId) || "General",
          durationMinutes,
          time: `${durationMinutes} mins`,
          price,
          deposit,
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
      policyApplied: bookingPolicy?.bookingPolicy || "DEFAULT",
    });
  } catch (err: any) {
    console.error("Failed to query Square treatments & policy:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load treatments" },
      { status: 500 },
    );
  }
}
