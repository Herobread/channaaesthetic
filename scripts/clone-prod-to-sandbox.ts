// scripts/clone-prod-to-sandbox.ts
import { parse } from "dotenv";
import fs from "node:fs";
import path from "node:path";

function readEnv(filename: string): Record<string, string> {
  const fullPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) return {};
  return parse(fs.readFileSync(fullPath, "utf-8"));
}

const devEnv = readEnv(".env.development.local");
const prodEnv = readEnv(".env.production.local");

const SANDBOX_TOKEN = devEnv.SQUARE_ACCESS_TOKEN;
const PROD_TOKEN = prodEnv.SQUARE_ACCESS_TOKEN;

if (!SANDBOX_TOKEN || !PROD_TOKEN) {
  console.error("\n❌ Could not load tokens from env files.");
  process.exit(1);
}

const PROD_BASE = "https://connect.squareup.com";
const SANDBOX_BASE = "https://connect.squareupsandbox.com";
const HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Square-Version": "2024-10-17",
  "Content-Type": "application/json",
});

async function fetchAll(baseUrl: string, token: string, types: string) {
  let cursor: string | undefined;
  const list: any[] = [];
  do {
    const url = new URL(`${baseUrl}/v2/catalog/list`);
    url.searchParams.set("types", types);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), { headers: HEADERS(token) });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    if (data.objects) list.push(...data.objects);
    cursor = data.cursor;
  } while (cursor);
  return list;
}

async function cloneCatalog() {
  console.log("1. Fetching Production catalog...");
  const prodObjects = await fetchAll(
    PROD_BASE,
    PROD_TOKEN!,
    "ITEM,CATEGORY,CUSTOM_ATTRIBUTE_DEFINITION",
  );
  console.log(`Found ${prodObjects.length} objects in Production.`);

  console.log("2. Checking existing objects in Sandbox...");
  const existingSandboxObjects = await fetchAll(
    SANDBOX_BASE,
    SANDBOX_TOKEN!,
    "ITEM,CATEGORY,CUSTOM_ATTRIBUTE_DEFINITION",
  );

  const existingSandboxDefs = existingSandboxObjects.filter(
    (o) => o.type === "CUSTOM_ATTRIBUTE_DEFINITION",
  );
  const existingSandboxCats = existingSandboxObjects.filter(
    (o) => o.type === "CATEGORY",
  );
  const existingSandboxItems = existingSandboxObjects.filter(
    (o) => o.type === "ITEM",
  );

  const prodToSandboxIdMap = new Map<string, string>();
  const toCreatePhase1: any[] = [];

  // Match or schedule Custom Attribute Definitions
  const prodDefs = prodObjects.filter(
    (o) => o.type === "CUSTOM_ATTRIBUTE_DEFINITION",
  );
  prodDefs.forEach((def, idx) => {
    const existing = existingSandboxDefs.find(
      (s) =>
        s.custom_attribute_definition_data?.key ===
        def.custom_attribute_definition_data?.key,
    );
    if (existing) {
      prodToSandboxIdMap.set(def.id, existing.id);
    } else {
      const tempId = `#def_${idx}`;
      prodToSandboxIdMap.set(def.id, tempId);
      const clean = JSON.parse(JSON.stringify(def));
      clean.id = tempId;
      delete clean.version;
      delete clean.updated_at;
      delete clean.created_at;
      toCreatePhase1.push(clean);
    }
  });

  // Match or schedule Categories
  const prodCats = prodObjects.filter((o) => o.type === "CATEGORY");
  prodCats.forEach((cat, idx) => {
    const existing = existingSandboxCats.find(
      (s) =>
        s.category_data?.name?.trim().toLowerCase() ===
        cat.category_data?.name?.trim().toLowerCase(),
    );
    if (existing) {
      prodToSandboxIdMap.set(cat.id, existing.id);
    } else {
      const tempId = `#cat_${idx}`;
      prodToSandboxIdMap.set(cat.id, tempId);
      const clean = JSON.parse(JSON.stringify(cat));
      clean.id = tempId;
      delete clean.version;
      delete clean.updated_at;
      delete clean.created_at;
      delete clean.present_at_location_ids;
      clean.present_at_all_locations = true;
      toCreatePhase1.push(clean);
    }
  });

  if (toCreatePhase1.length > 0) {
    console.log(
      `3. Upserting ${toCreatePhase1.length} new definitions/categories...`,
    );
    const res = await fetch(`${SANDBOX_BASE}/v2/catalog/batch-upsert`, {
      method: "POST",
      headers: HEADERS(SANDBOX_TOKEN!),
      body: JSON.stringify({
        idempotency_key: `phase1-${Date.now()}`,
        batches: [{ objects: toCreatePhase1 }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Phase 1 failed:", JSON.stringify(data, null, 2));
      return;
    }
    (data.id_mappings || []).forEach(
      (m: { client_object_id: string; object_id: string }) => {
        for (const [prodId, mapVal] of prodToSandboxIdMap.entries()) {
          if (mapVal === m.client_object_id) {
            prodToSandboxIdMap.set(prodId, m.object_id);
          }
        }
      },
    );
  }

  // --- PHASE 2: Items & Variations (Skip already-existing Sandbox items) ---
  const prodItems = prodObjects.filter((o) => o.type === "ITEM");
  console.log(
    `4. Checking & filtering ${prodItems.length} production items...`,
  );

  // Track claimed Sandbox names and IDs so we skip duplicates
  const existingItemNames = new Set(
    existingSandboxItems
      .map((i) => i.item_data?.name?.trim().toLowerCase())
      .filter(Boolean),
  );

  const seenBatchIds = new Set<string>();
  let skippedCount = 0;

  const preparedItems = prodItems
    .filter((item) => {
      const itemName = item.item_data?.name?.trim().toLowerCase();
      // If it already exists in sandbox, skip it completely
      if (itemName && existingItemNames.has(itemName)) {
        skippedCount++;
        return false;
      }
      return true;
    })
    .map((item, idx) => {
      const clean = JSON.parse(JSON.stringify(item));
      clean.id = `#item_${idx}`;
      delete clean.version;
      delete clean.updated_at;
      delete clean.created_at;
      delete clean.is_deleted;
      delete clean.present_at_location_ids;
      clean.present_at_all_locations = true;

      if (clean.item_data) {
        delete clean.item_data.image_id;
        delete clean.item_data.image_ids;
      }

      if (
        clean.item_data?.category_id &&
        prodToSandboxIdMap.has(clean.item_data.category_id)
      ) {
        clean.item_data.category_id = prodToSandboxIdMap.get(
          clean.item_data.category_id,
        );
      }

      if (clean.item_data?.variations) {
        clean.item_data.variations = clean.item_data.variations.map(
          (v: any, vIdx: number) => {
            const cleanVar = { ...v };
            cleanVar.id = `#item_${idx}_var_${vIdx}`;
            delete cleanVar.version;
            delete cleanVar.updated_at;
            delete cleanVar.created_at;
            delete cleanVar.location_overrides;
            delete cleanVar.team_member_ids;
            delete cleanVar.present_at_location_ids;
            delete cleanVar.item_variation_data?.image_id;
            cleanVar.present_at_all_locations = true;
            return cleanVar;
          },
        );
      }

      if (clean.custom_attribute_values) {
        Object.keys(clean.custom_attribute_values).forEach((key) => {
          const val = clean.custom_attribute_values[key];
          if (
            val.custom_attribute_definition_id &&
            prodToSandboxIdMap.has(val.custom_attribute_definition_id)
          ) {
            val.custom_attribute_definition_id = prodToSandboxIdMap.get(
              val.custom_attribute_definition_id,
            );
          }
        });
      }

      return clean;
    });

  console.log(
    `Skipped ${skippedCount} already-existing items. Inserting ${preparedItems.length} new items...`,
  );

  if (preparedItems.length === 0) {
    console.log(
      "All production items already exist in Sandbox. Nothing to insert!",
    );
    return;
  }

  const chunkSize = 50;
  for (let i = 0; i < preparedItems.length; i += chunkSize) {
    const chunk = preparedItems.slice(i, i + chunkSize);
    const batchRes = await fetch(`${SANDBOX_BASE}/v2/catalog/batch-upsert`, {
      method: "POST",
      headers: HEADERS(SANDBOX_TOKEN!),
      body: JSON.stringify({
        idempotency_key: `items-${i}-${Date.now()}`,
        batches: [{ objects: chunk }],
      }),
    });

    const batchData = await batchRes.json();
    if (!batchRes.ok) {
      console.error(
        `Item batch ${Math.floor(i / chunkSize) + 1} failed:`,
        JSON.stringify(batchData, null, 2),
      );
      return;
    }

    console.log(
      `Inserted ${Math.min(i + chunkSize, preparedItems.length)} / ${preparedItems.length} items`,
    );
  }

  console.log("\nFinished! Sandbox is synced and all duplicates skipped.");
}

cloneCatalog();
