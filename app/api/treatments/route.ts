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

    // 2. Query Catalog Items, Categories, Images & Custom Attributes
    const catalogResponse = await square.catalog.search({
      cursor,
      objectTypes: ["ITEM", "CATEGORY", "IMAGE", "CUSTOM_ATTRIBUTE_DEFINITION"],
      includeRelatedObjects: true,
    });

    const objects = catalogResponse.objects || [];
    const relatedObjects = (catalogResponse as any).relatedObjects || [];
    const allObjects = [...objects, ...relatedObjects];
    const nextCursor = catalogResponse.cursor || undefined;

    const categoryMap = new Map<string, string>();
    const imageMap = new Map<string, string>();
    const depositAttrDefIds = new Set<string>();

    allObjects.forEach((obj: any) => {
      // Map Categories
      const catName = obj.categoryData?.name || obj.category_data?.name;
      if (obj.type === "CATEGORY" && catName) {
        categoryMap.set(obj.id, catName);
      }

      // Map Images
      const imgUrl = obj.imageData?.url || obj.image_data?.url;
      if (obj.type === "IMAGE" && imgUrl) {
        imageMap.set(obj.id, imgUrl);
      }

      // Identify any Custom Attribute Definition named "deposit"
      if (obj.type === "CUSTOM_ATTRIBUTE_DEFINITION") {
        const attrData =
          obj.customAttributeDefinitionData ||
          obj.custom_attribute_definition_data;
        const name = (attrData?.name || "").toLowerCase();
        const key = (attrData?.key || "").toLowerCase();
        if (name === "deposit" || key === "deposit") {
          depositAttrDefIds.add(obj.id);
        }
      }
    });

    // Helper: Extracts the deposit number from customAttributeValues
    const extractDepositFromAttrs = (
      attrMap: Record<string, any> | undefined,
    ): number | null => {
      if (!attrMap || typeof attrMap !== "object") return null;

      for (const [key, entry] of Object.entries(attrMap)) {
        const defId =
          entry?.customAttributeDefinitionId ||
          entry?.custom_attribute_definition_id;

        const isDepositField =
          key.toLowerCase().includes("deposit") ||
          (defId && depositAttrDefIds.has(defId));

        if (isDepositField) {
          const rawVal =
            entry?.numberValue ??
            entry?.number_value ??
            entry?.stringValue ??
            entry?.string_value;

          if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
            const parsed = Number(rawVal);
            if (!isNaN(parsed)) return parsed;
          }
        }
      }
      return null;
    };

    // 3. Map treatments
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

        // Check for deposit attribute on parent item
        const itemAttrs =
          item.customAttributeValues || item.custom_attribute_values;
        const itemLevelDeposit = extractDepositFromAttrs(itemAttrs);

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

          // Check variation-level attribute first, fallback to parent item attribute
          const varAttrs =
            vObj.customAttributeValues || vObj.custom_attribute_values;
          const varLevelDeposit = extractDepositFromAttrs(varAttrs);

          const resolvedNativeDeposit =
            varLevelDeposit !== null ? varLevelDeposit : itemLevelDeposit;

          // Priority: 1. Native Custom Attribute -> 2. Free Treatment -> 3. Fallback Cap (£30)
          let deposit = 0;
          if (price > 0) {
            if (resolvedNativeDeposit !== null) {
              deposit = Math.min(resolvedNativeDeposit, price);
            } else {
              deposit = Math.min(30, price);
            }
          }

          return {
            id: vObj.id,
            title: vData.name || itemData.name || "Standard",
            price,
            durationMinutes,
            time: `${durationMinutes} mins`,
            deposit,
          };
        });

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
      policyApplied: "SQUARE_CUSTOM_ATTRIBUTES",
    });
  } catch (err: any) {
    console.error("Failed to query Square treatments & attributes:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load treatments" },
      { status: 500 },
    );
  }
}
