import dotenv from "dotenv";
import { SquareClient, SquareEnvironment } from "square";

dotenv.config({ path: ".env.local" });

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

async function createAttribute() {
  const response = await square.catalog.object.upsert({
    idempotencyKey: crypto.randomUUID(),
    object: {
      type: "CUSTOM_ATTRIBUTE_DEFINITION",
      id: "#deposit-attr-def",
      customAttributeDefinitionData: {
        name: "Booking Deposit",
        key: "booking_deposit",
        description: "Non-refundable upfront booking deposit in GBP (£)",
        type: "NUMBER",
        allowedObjectTypes: ["ITEM"],
        visibility: "VISIBILITY_READ_WRITE_VALUES", // Editable in Square Dashboard UI
      },
    },
  });

  console.log("✅ Custom Attribute Created! ID:", response.object?.id);
}

createAttribute().catch(console.error);
