// app/api/treatments/route.ts
import { square } from "@/lib/square";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
      // Support camelCase and snake_case representations
      const catName = obj.categoryData?.name || obj.category_data?.name;
      if (obj.type === "CATEGORY" && catName) {
        categoryMap.set(obj.id, catName);
      }

      const imgUrl = obj.imageData?.url || obj.image_data?.url;
      if (obj.type === "IMAGE" && imgUrl) {
        imageMap.set(obj.id, imgUrl);
      }
    });

    // 4. Map treatments and calculate deposit strictly using Square's Policy Profile
    const items = objects
      .filter((obj: any) => {
        if (obj.type !== "ITEM" || obj.isDeleted) return false;
        const itemData = obj.itemData || obj.item_data || {};
        const variations = itemData.variations || [];

        return (
          itemData.productType === "APPOINTMENTS_SERVICE" ||
          itemData.product_type === "APPOINTMENTS_SERVICE" ||
          variations.some((v: any) => {
            const vData = v.itemVariationData || v.item_variation_data;
            return (
              Boolean(vData?.serviceDuration || vData?.service_duration) ||
              vData?.availableForBooking === true ||
              vData?.available_for_booking === true
            );
          })
        );
      })
      .map((item: any) => {
        const itemData = item.itemData || item.item_data || {};
        const rawVariations = itemData.variations || [];

        const policyRequirement =
          bookingPolicy?.bookingPolicy || bookingPolicy?.booking_policy;
        const settings =
          bookingPolicy?.depositSettings || bookingPolicy?.deposit_settings;
        const depositPercentage =
          settings?.percentage || settings?.deposit_percentage;
        const depositFixed =
          settings?.fixedAmountMoney?.amount ||
          settings?.fixed_amount_money?.amount;

        const calculateDeposit = (price: number) => {
          if (policyRequirement === "REQUIRE_FULL_PAYMENT") return price;
          if (policyRequirement === "REQUIRE_DEPOSIT" || Boolean(settings)) {
            if (depositPercentage) {
              const pct =
                Number(depositPercentage) > 1
                  ? Number(depositPercentage) / 100
                  : Number(depositPercentage);
              return Math.round(price * pct * 100) / 100;
            }
            if (depositFixed) {
              return Math.min(Number(depositFixed) / 100, price);
            }
            return Math.min(30, price);
          }
          return price > 0 ? Math.min(30, price) : 0;
        };

        // Map every variation on this catalog item
        const variations = rawVariations.map((vObj: any) => {
          const vData =
            vObj.itemVariationData || vObj.item_variation_data || {};
          const durationMs = Number(
            vData.serviceDuration || vData.service_duration || 2700000,
          );
          const durationMinutes = Math.max(
            10,
            Math.round(durationMs / (60 * 1000)),
          );

          const priceMoney = vData.priceMoney || vData.price_money;
          const price = priceMoney?.amount
            ? Number(priceMoney.amount) / 100
            : 0;
          const deposit = calculateDeposit(price);

          return {
            id: vObj.id,
            title: vData.name || itemData.name || "Standard",
            price,
            durationMinutes,
            time: `${durationMinutes} mins`,
            deposit,
          };
        });

        // Fallback default to first variation
        const defaultVar = variations[0] || {
          id: item.id,
          title: "Standard",
          price: 0,
          durationMinutes: 30,
          time: "30 mins",
          deposit: 0,
        };

        const isEverywhere = Boolean(
          item.presentAtAllLocations ?? item.present_at_all_locations,
        );
        const locationIds: string[] = isEverywhere
          ? activeLocations.map((l: any) => l.id)
          : item.presentAtLocationIds || item.present_at_location_ids || [];

        const locations = isEverywhere
          ? activeLocations
          : locationIds
              .map((id) => activeLocations.find((l: any) => l.id === id))
              .filter(Boolean);

        const imageIds = itemData.imageIds || itemData.image_ids;
        const firstImageId = imageIds?.[0];
        const imageUrl = firstImageId ? imageMap.get(firstImageId) : undefined;

        // Resolve Category: Check singular categoryId, snake_case, and plural categories array
        const primaryCatId =
          itemData.categoryId ||
          itemData.category_id ||
          itemData.categories?.[0]?.id;

        const resolvedCategory = primaryCatId
          ? categoryMap.get(primaryCatId)
          : null;

        return {
          id: item.id,
          variationId: defaultVar.id,
          title: itemData.name || "Untitled Treatment",
          desc: itemData.description || "Bespoke clinical treatment.",
          category: resolvedCategory || "General",
          durationMinutes: defaultVar.durationMinutes,
          time: defaultVar.time,
          price: defaultVar.price,
          deposit: defaultVar.deposit,
          imageUrl,
          locationIds,
          locations,
          featured: defaultVar.price === 0,
          variations,
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
