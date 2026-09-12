import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { SquareClient, SquareEnvironment } from "square";

dotenv.config({ path: ".env.local" });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

async function syncDeposits() {
  console.log("🔍 Fetching Sanity treatments with deposits...");
  const sanityTreatments = await sanity.fetch(`
    *[_type == "treatment"] {
      title,
      deposit,
      priceNum
    }
  `);

  // Build a normalized lookup map by title
  const sanityMap = new Map();
  sanityTreatments.forEach((t) => {
    if (t.title) {
      sanityMap.set(t.title.trim().toLowerCase(), t.deposit || 0);
    }
  });

  console.log(`📦 Loaded ${sanityTreatments.length} treatments from Sanity.`);

  console.log("🔍 Fetching live Square catalog items...");
  const catalogRes = await square.catalog.search({
    objectTypes: ["ITEM"],
  });

  const items = (catalogRes.objects || []).filter((obj) => obj.type === "ITEM");
  console.log(`🏬 Found ${items.length} items in Square.`);

  const updates = [];

  for (const item of items) {
    const title = item.itemData?.name?.trim().toLowerCase();
    const depositAmount = sanityMap.get(title);

    if (depositAmount !== undefined && depositAmount > 0) {
      let desc = item.itemData?.description || "";
      // Strip any old deposit tag first
      desc = desc.replace(/\[Deposit:\s*£?[0-9.]+\]/gi, "").trim();
      // Append the clean deposit tag
      const updatedDesc = desc
        ? `${desc}\n[Deposit: £${depositAmount}]`
        : `[Deposit: £${depositAmount}]`;

      item.itemData.description = updatedDesc;
      updates.push(item);
    }
  }

  if (updates.length === 0) {
    console.log("⚠️ No matching treatments with deposits found to update.");
    return;
  }

  console.log(
    `🚀 Updating ${updates.length} items with deposit data in Square...`,
  );

  // Batch update Square Catalog
  const res = await square.catalog.batchUpsert({
    idempotencyKey: crypto.randomUUID(),
    batches: [{ objects: updates }],
  });

  console.log(
    `✅ Successfully synced ${res.objects?.length || updates.length} items with deposits!`,
  );
}

syncDeposits().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
