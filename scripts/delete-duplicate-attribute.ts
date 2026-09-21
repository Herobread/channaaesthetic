// scripts/delete-duplicate-attribute.ts
import { parse } from "dotenv";
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
const isSandbox =
  TOKEN?.startsWith("sandbox-") ||
  env.NEXT_PUBLIC_SQUARE_APP_ID?.startsWith("sandbox-");
const BASE_URL = isSandbox
  ? "https://connect.squareupsandbox.com"
  : "https://connect.squareup.com";

async function cleanup() {
  const res = await fetch(`${BASE_URL}/v2/catalog/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_types: ["CUSTOM_ATTRIBUTE_DEFINITION"],
    }),
  });

  const data = await res.json();
  const defs = data.objects || [];

  for (const def of defs) {
    const name = def.custom_attribute_definition_data?.name;
    // Delete the duplicate "Deposit Amount" definition
    if (name === "Deposit Amount") {
      console.log(`Deleting duplicate attribute: "${name}" (${def.id})...`);
      await fetch(`${BASE_URL}/v2/catalog/object/${def.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });
      console.log("Deleted.");
    }
  }
}

cleanup();
