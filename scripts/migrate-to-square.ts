import { createClient } from "@sanity/client";
import * as crypto from "crypto";
import * as dotenv from "dotenv";
import { SquareClient, SquareEnvironment } from "square";

// Load .env / .env.local
dotenv.config({ path: ".env.local" });
dotenv.config();

// ---------------------------------------------------------------------------
// Client Setup
// ---------------------------------------------------------------------------
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SanityTreatment {
  _id: string;
  title: string;
  category?: string;
  desc?: string;
  priceNum: number;
  deposit?: number;
  durationMinutes: number;
  featured?: boolean;
  locations?: Array<{ _id: string; name?: string }>;
}

interface SanityLocation {
  _id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Migration Runner
// ---------------------------------------------------------------------------
async function runMigration() {
  console.log("🚀 Starting Sanity -> Square migration...\n");

  // 1. Fetch Square Locations (v40+ syntax: square.locations.list())
  console.log("📍 Querying Square locations...");
  const locResponse = await square.locations.list();
  const rawLocations = Array.isArray(locResponse)
    ? locResponse
    : (locResponse as any).locations || [];

  const squareLocations = rawLocations.filter(
    (l: any) => l.status === "ACTIVE",
  );

  if (!squareLocations.length) {
    throw new Error(
      "❌ No active locations found in Square. Ensure you have at least one location in Square Dashboard.",
    );
  }
  console.log(
    `   Found ${squareLocations.length} active location(s) in Square.`,
  );

  // 2. Fetch Sanity Locations & Map IDs
  console.log("📍 Querying Sanity clinic locations...");
  const sanityLocations: SanityLocation[] = await sanity.fetch(
    `*[_type == "clinicLocation"]{ _id, name }`,
  );

  const locationMap = new Map<string, string>();

  for (const sLoc of sanityLocations) {
    const directMatch = squareLocations.find((sql: any) => sql.id === sLoc._id);
    if (directMatch?.id) {
      locationMap.set(sLoc._id, directMatch.id);
      continue;
    }

    const nameMatch = squareLocations.find(
      (sql: any) =>
        sql.name?.toLowerCase().trim() === sLoc.name?.toLowerCase().trim(),
    );
    if (nameMatch?.id) {
      locationMap.set(sLoc._id, nameMatch.id);
      continue;
    }

    locationMap.set(sLoc._id, squareLocations[0].id);
  }

  // 3. Fetch Treatments from Sanity
  console.log("📦 Fetching treatment documents from Sanity...");
  const treatments: SanityTreatment[] = await sanity.fetch(
    `*[_type == "treatment"]{
      _id,
      title,
      category,
      desc,
      priceNum,
      deposit,
      durationMinutes,
      featured,
      "locations": locations[]->{ _id, name }
    }`,
  );

  console.log(`   Found ${treatments.length} treatments.\n`);

  if (!treatments.length) {
    console.log("ℹ️ No treatments found in Sanity. Exiting.");
    return;
  }

  // 4. Create Square Categories
  const uniqueCategories = Array.from(
    new Set(
      treatments
        .map((t) => t.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  );

  const categoryMap = new Map<string, string>();
  const catalogObjects: any[] = [];

  uniqueCategories.forEach((catName, idx) => {
    const tempCatId = `#cat_${idx}`;
    categoryMap.set(catName, tempCatId);

    catalogObjects.push({
      type: "CATEGORY",
      id: tempCatId,
      categoryData: {
        name: catName,
      },
    });
  });

  // 5. Convert Treatments to Square APPOINTMENTS_SERVICE Items
  treatments.forEach((t, idx) => {
    const tempItemId = `#item_${idx}`;
    const tempVarId = `#var_${idx}`;

    const assignedLocationIds = (t.locations || [])
      .map((loc) => locationMap.get(loc._id))
      .filter((id): id is string => Boolean(id));

    const finalLocationIds =
      assignedLocationIds.length > 0
        ? assignedLocationIds
        : [squareLocations[0].id];

    const pricePence = BigInt(Math.round((t.priceNum || 0) * 100));
    const durationMs = BigInt((t.durationMinutes || 30) * 60 * 1000);
    const categoryId = t.category
      ? categoryMap.get(t.category.trim())
      : undefined;

    catalogObjects.push({
      type: "ITEM",
      id: tempItemId,
      presentAtLocationIds: finalLocationIds,
      itemData: {
        name: t.title || "Untitled Service",
        description: t.desc || undefined,
        productType: "APPOINTMENTS_SERVICE",
        categoryId: categoryId,
        variations: [
          {
            type: "ITEM_VARIATION",
            id: tempVarId,
            presentAtLocationIds: finalLocationIds,
            itemVariationData: {
              name: `${t.durationMinutes || 30} mins`,
              pricingType: "FIXED_PRICING",
              priceMoney: {
                amount: pricePence,
                currency: "GBP",
              },
              serviceDuration: durationMs,
            },
          },
        ],
      },
    });
  });

  // 6. Batch Upsert to Square (v40+ syntax: square.catalog.batchUpsert)
  console.log(
    `🚀 Uploading ${catalogObjects.length} objects (Categories + Services) to Square...`,
  );

  const BATCH_SIZE = 100;
  for (let i = 0; i < catalogObjects.length; i += BATCH_SIZE) {
    const batch = catalogObjects.slice(i, i + BATCH_SIZE);

    const result = await square.catalog.batchUpsert({
      idempotencyKey: crypto.randomUUID(),
      batches: [{ objects: batch }],
    });

    const createdCount = (result as any).objects?.length ?? batch.length;
    console.log(
      `   ✅ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1} (${createdCount} objects)`,
    );
  }

  console.log(
    "\n🎉 Done! All treatments and categories are now live in Square.",
  );
}

runMigration().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
