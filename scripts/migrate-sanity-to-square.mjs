import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { SquareClient, SquareEnvironment } from "square";

dotenv.config({ path: ".env.local" });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN, // Needs read token
});

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

async function runMigration() {
  console.log("🚀 Starting Sanity -> Square Catalog Migration...");

  // 1. Fetch active clinic locations and primary bookable team member
  const locationsRes = await square.locations.list();
  const locationIds = (locationsRes.locations || []).map((l) => l.id);

  if (locationIds.length === 0) {
    throw new Error("No locations found in Square.");
  }

  const teamRes = await square.teamMembers.search({
    query: { filter: { status: "ACTIVE" } },
  });
  const teamMemberId = teamRes.teamMembers?.[0]?.id;

  if (!teamMemberId) {
    throw new Error("No active staff member found in Square Appointments.");
  }

  console.log(
    `📍 Found ${locationIds.length} location(s). Staff ID: ${teamMemberId}`,
  );

  // 2. Fetch all treatments from Sanity
  const treatments = await sanity.fetch(`
    *[_type == "treatment"] {
      _id,
      title,
      category,
      desc,
      priceNum,
      deposit,
      durationMinutes,
      featured
    }
  `);

  console.log(`📦 Found ${treatments.length} treatments in Sanity.`);

  // 3. Batch upsert into Square Catalog
  const batches = [];
  const chunkSize = 20;

  for (let i = 0; i < treatments.length; i += chunkSize) {
    batches.push(treatments.slice(i, i + chunkSize));
  }

  for (let bIndex = 0; bIndex < batches.length; bIndex++) {
    const chunk = batches[bIndex];
    const catalogObjects = [];

    for (const t of chunk) {
      const clientItemId = `#item-${t._id}`;
      const clientVariationId = `#var-${t._id}`;
      const durationMs = (t.durationMinutes || 30) * 60 * 1000;
      const priceInPence = BigInt(Math.round((t.priceNum || 0) * 100));

      catalogObjects.push({
        type: "ITEM",
        id: clientItemId,
        presentAtAllLocations: true,
        itemData: {
          name: t.title,
          description: [
            t.desc || "",
            t.deposit ? `[Deposit: £${t.deposit}]` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          variations: [
            {
              type: "ITEM_VARIATION",
              id: clientVariationId,
              presentAtAllLocations: true,
              itemVariationData: {
                name: "Standard Consultation & Treatment",
                pricingType: "FIXED_PRICING",
                priceMoney: {
                  amount: priceInPence,
                  currency: "GBP",
                },
                serviceDuration: BigInt(durationMs),
                availableForBooking: true,
                teamMemberIds: [teamMemberId],
              },
            },
          ],
        },
      });
    }

    console.log(`⏳ Uploading batch ${bIndex + 1}/${batches.length}...`);

    const res = await square.catalog.batchUpsert({
      idempotencyKey: crypto.randomUUID(),
      batches: [{ objects: catalogObjects }],
    });

    console.log(
      `✅ Batch ${bIndex + 1} written. Saved ${res.objects?.length || 0} objects.`,
    );
  }

  console.log("🎉 Sanity treatments successfully migrated to Square!");
}

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
