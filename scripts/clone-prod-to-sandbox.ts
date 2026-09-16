// scripts/clone-locations-to-sandbox.ts
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
  console.error("❌ Missing SQUARE_ACCESS_TOKEN in env files.");
  process.exit(1);
}

const PROD_BASE = "https://connect.squareup.com";
const SANDBOX_BASE = "https://connect.squareupsandbox.com";

const HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Square-Version": "2025-02-20",
  "Content-Type": "application/json",
});

async function getLocations(baseUrl: string, token: string) {
  const res = await fetch(`${baseUrl}/v2/locations`, {
    headers: HEADERS(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.locations || [];
}

async function cloneLocations() {
  console.log("1. Fetching Production locations...");
  const prodLocations = await getLocations(PROD_BASE, PROD_TOKEN!);
  console.log(`Found ${prodLocations.length} locations in Production.`);

  console.log("2. Fetching Sandbox locations...");
  const sandboxLocations = await getLocations(SANDBOX_BASE, SANDBOX_TOKEN!);
  console.log(`Found ${sandboxLocations.length} locations in Sandbox.`);

  const locationIdMap = new Map<string, string>();

  for (let i = 0; i < prodLocations.length; i++) {
    const prodLoc = prodLocations[i];

    // Clean out read-only fields
    const payload: any = {
      name: prodLoc.name,
      business_name: prodLoc.business_name || prodLoc.name,
      description: prodLoc.description,
      address: prodLoc.address,
      phone_number: prodLoc.phone_number,
      website_url: prodLoc.website_url,
      business_hours: prodLoc.business_hours,
      timezone: prodLoc.timezone,
    };

    // If Sandbox has an existing slot/default location, update it
    if (sandboxLocations[i]) {
      const targetId = sandboxLocations[i].id;
      console.log(
        `Updating existing Sandbox location ${targetId} -> "${payload.name}"...`,
      );

      const res = await fetch(`${SANDBOX_BASE}/v2/locations/${targetId}`, {
        method: "PUT",
        headers: HEADERS(SANDBOX_TOKEN!),
        body: JSON.stringify({ location: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn(`Failed to update location ${targetId}:`, data);
      } else {
        locationIdMap.set(prodLoc.id, targetId);
      }
    } else {
      // Create new location in Sandbox
      console.log(`Creating new Sandbox location -> "${payload.name}"...`);
      const res = await fetch(`${SANDBOX_BASE}/v2/locations`, {
        method: "POST",
        headers: HEADERS(SANDBOX_TOKEN!),
        body: JSON.stringify({
          location: payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn(`Failed to create location for "${payload.name}":`, data);
      } else if (data.location?.id) {
        locationIdMap.set(prodLoc.id, data.location.id);
      }
    }
  }

  console.log("\n--- Location Mapping (Prod ID -> Sandbox ID) ---");
  for (const [prodId, sandboxId] of locationIdMap.entries()) {
    console.log(`${prodId} => ${sandboxId}`);
  }
}

cloneLocations();
