// scripts/create-deposit-attribute.ts
import { config } from "dotenv";
config({ path: ".env.local" });

const token = process.env.SQUARE_ACCESS_TOKEN;
const isProd = process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production";
const baseUrl = isProd
  ? "https://connect.squareup.com"
  : "https://connect.squareupsandbox.com";

async function setupDepositAttribute() {
  if (!token) {
    console.error("SQUARE_ACCESS_TOKEN is missing from .env.local");
    return;
  }

  console.log(`Connecting to Square (${isProd ? "Production" : "Sandbox"})...`);

  try {
    const res = await fetch(`${baseUrl}/v2/catalog/object`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-10-17",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: "setup-deposit-attribute-key-v2",
        object: {
          type: "CUSTOM_ATTRIBUTE_DEFINITION",
          id: "#deposit-attribute-def",
          custom_attribute_definition_data: {
            type: "NUMBER",
            name: "Deposit Amount",
            key: "deposit_amount",
            description: "Required deposit amount in GBP",
            allowed_object_types: ["ITEM"],
            visibility: "VISIBILITY_READ_WRITE_VALUES", // Visible & editable directly in Square Dashboard
          },
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Square API Error:", JSON.stringify(data, null, 2));
      return;
    }

    console.log("Successfully created Square Custom Attribute Definition!");
    console.log("Attribute ID:", data.catalog_object?.id);
  } catch (err) {
    console.error("Network or script error:", err);
  }
}

setupDepositAttribute();
