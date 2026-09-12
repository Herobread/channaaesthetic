import * as dotenv from "dotenv";
import { SquareClient, SquareEnvironment } from "square";

dotenv.config({ path: ".env.local" });
dotenv.config();

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

async function makeAllServicesBookable() {
  console.log("🚀 Initializing Square service update...\n");

  // 1. Fetch all active Team Members
  console.log("👥 Fetching team members...");
  const teamResponse = await square.teamMembers.search({
    query: {
      filter: {
        status: "ACTIVE",
      },
    },
  });

  const rawMembers = (teamResponse as any).teamMembers || [];
  const teamMemberIds = rawMembers.map((m: any) => m.id).filter(Boolean);

  console.log(
    `   Found ${teamMemberIds.length} active team members:`,
    teamMemberIds,
  );

  if (teamMemberIds.length === 0) {
    console.error(
      "❌ No active team members found. You must have at least 1 staff member/owner configured in Square Appointments.",
    );
    return;
  }

  // 2. Fetch all active Locations
  console.log("📍 Fetching active locations...");
  const locResponse = await square.locations.list();
  const rawLocations = Array.isArray(locResponse)
    ? locResponse
    : (locResponse as any).locations || [];

  const locationIds = rawLocations
    .filter((l: any) => l.status === "ACTIVE")
    .map((l: any) => l.id);

  console.log(`   Found ${locationIds.length} active locations:`, locationIds);

  // 3. Fetch all Catalog Items
  console.log("\n📦 Fetching all appointment services from Catalog...");
  const catalogSearch = await square.catalog.search({
    objectTypes: ["ITEM"],
  });

  const objects = (catalogSearch.objects || []).filter(
    (obj: any) =>
      obj.type === "ITEM" &&
      obj.itemData?.productType === "APPOINTMENTS_SERVICE" &&
      !obj.isDeleted,
  );

  console.log(`   Found ${objects.length} appointment items to update.\n`);

  // 4. Update each item and its variations
  const batches: any[] = [];

  for (const item of objects) {
    const updatedVariations = (item.itemData.variations || []).map(
      (variation: any) => {
        return {
          ...variation,
          presentAtAllLocations: true,
          itemVariationData: {
            ...variation.itemVariationData,
            availableForBooking: true,
            teamMemberIds: teamMemberIds, // Assign to all bookable staff
          },
        };
      },
    );

    batches.push({
      ...item,
      presentAtAllLocations: true,
      itemData: {
        ...item.itemData,
        variations: updatedVariations,
      },
    });
  }

  // Square batchUpsert handles up to 100 objects per call
  const CHUNK_SIZE = 50;
  let updatedTotal = 0;

  for (let i = 0; i < batches.length; i += CHUNK_SIZE) {
    const chunk = batches.slice(i, i + CHUNK_SIZE);
    console.log(
      `⏳ Updating batch ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} items)...`,
    );

    const res = await square.catalog.batchUpsert({
      idempotencyKey: crypto.randomUUID(),
      batches: [
        {
          objects: chunk,
        },
      ],
    });

    const saved = res.objects?.length || 0;
    updatedTotal += saved;
    console.log(`   ✅ Saved ${saved} items in this batch.`);
  }

  console.log(
    `\n🎉 Success! All ${updatedTotal} services and variations are now marked bookable online for all staff and locations.`,
  );
}

makeAllServicesBookable().catch((err) => {
  console.error("❌ Fatal error making services bookable:", err);
  process.exit(1);
});
