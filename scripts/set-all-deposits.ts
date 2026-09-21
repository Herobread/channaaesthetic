// scripts/set-all-deposits.ts
import { parse } from "dotenv";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function readEnv(filename: string): Record<string, string> {
  const fullPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) return {};
  return parse(fs.readFileSync(fullPath, "utf-8"));
}

const env = {
  ...readEnv(".env"),
  ...readEnv(".env.local"),
  ...readEnv(".env.development.local"),
  ...readEnv(".env.production.local"),
};

const TOKEN = env.SQUARE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("❌ Missing SQUARE_ACCESS_TOKEN in env files.");
  process.exit(1);
}

const isSandbox =
  TOKEN.startsWith("sandbox-") ||
  env.NEXT_PUBLIC_SQUARE_APP_ID?.startsWith("sandbox-");
const BASE_URL = isSandbox
  ? "https://connect.squareupsandbox.com"
  : "https://connect.squareup.com";

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Square-Version": "2025-02-20",
  "Content-Type": "application/json",
};

async function getOrCreateDepositDefinition(): Promise<string> {
  console.log(
    "1. Checking for existing 'deposit' custom attribute definition...",
  );

  const searchRes = await fetch(`${BASE_URL}/v2/catalog/search`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      object_types: ["CUSTOM_ATTRIBUTE_DEFINITION"],
    }),
  });

  const searchData = await searchRes.json();
  if (!searchRes.ok) {
    throw new Error(`Failed to search catalog: ${JSON.stringify(searchData)}`);
  }

  const existingDef = (searchData.objects || []).find((obj: any) => {
    const data = obj.custom_attribute_definition_data;
    return (
      data?.name?.toLowerCase() === "deposit" ||
      data?.key?.toLowerCase() === "deposit"
    );
  });

  if (existingDef) {
    console.log(`✓ Found existing definition ID: ${existingDef.id}`);
    return existingDef.id;
  }

  console.log("Creating new 'deposit' custom attribute definition...");
  const createRes = await fetch(`${BASE_URL}/v2/catalog/object`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      object: {
        type: "CUSTOM_ATTRIBUTE_DEFINITION",
        id: "#deposit-def",
        custom_attribute_definition_data: {
          key: "deposit",
          name: "deposit",
          description: "Fixed deposit fee in GBP required for booking",
          visibility: "VISIBILITY_READ_WRITE_VALUES",
          type: "NUMBER",
          allowed_object_types: ["ITEM"],
        },
      },
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(
      `Failed to create definition: ${JSON.stringify(createData)}`,
    );
  }

  const defId = createData.catalog_object.id;
  console.log(`✓ Created definition ID: ${defId}`);
  return defId;
}

async function getAllItems(): Promise<any[]> {
  console.log("2. Querying all services from Square Catalog...");
  let cursor: string | undefined = undefined;
  const items: any[] = [];

  do {
    const res = await fetch(`${BASE_URL}/v2/catalog/search`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        object_types: ["ITEM"],
        cursor,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to fetch items: ${JSON.stringify(data)}`);
    }

    if (data.objects) {
      items.push(...data.objects);
    }
    cursor = data.cursor;
  } while (cursor);

  console.log(`✓ Found ${items.length} items in catalog.`);
  return items;
}

async function applyDepositToAll() {
  try {
    const definitionId = await getOrCreateDepositDefinition();
    const items = await getAllItems();

    if (items.length === 0) {
      console.log("No items found to update.");
      return;
    }

    console.log(
      "3. Applying £1.00 deposit to all items via catalog batch-upsert...",
    );

    // Update items directly with custom_attribute_values
    const batches = [];
    const chunkSize = 50;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      const batchesToUpsert = chunk.map((item) => {
        const existingCustomValues = item.custom_attribute_values || {};
        return {
          ...item,
          custom_attribute_values: {
            ...existingCustomValues,
            deposit: {
              custom_attribute_definition_id: definitionId,
              key: "deposit",
              name: "deposit",
              number_value: "1",
              type: "NUMBER",
            },
          },
        };
      });

      const batchRes = await fetch(`${BASE_URL}/v2/catalog/batch-upsert`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          batches: [
            {
              objects: batchesToUpsert,
            },
          ],
        }),
      });

      const batchData = await batchRes.json();
      if (!batchRes.ok) {
        throw new Error(
          `Batch update failed: ${JSON.stringify(batchData.errors || batchData)}`,
        );
      }

      console.log(
        `✓ Updated items ${i + 1} to ${Math.min(i + chunkSize, items.length)} of ${items.length}`,
      );
    }

    console.log(
      "\n✅ All treatments now have deposit = 1 stored natively in Square Catalog!",
    );
  } catch (err: any) {
    console.error("❌ Script error:", err.message || err);
    process.exit(1);
  }
}

applyDepositToAll();
