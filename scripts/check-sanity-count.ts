// scripts/check-sanity-count.ts
import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function check() {
  // 1. Check all treatments including drafts
  const totalTreatmentsWithDrafts = await sanity.fetch(
    `count(*[_type == "treatment"])`,
  );
  const publishedOnly = await sanity.fetch(
    `count(*[_type == "treatment" && !(_id in path("drafts.**"))])`,
  );
  const draftsOnly = await sanity.fetch(
    `count(*[_type == "treatment" && (_id in path("drafts.**"))])`,
  );

  console.log("--- Sanity Treatment Counts ---");
  console.log(`Published treatments: ${publishedOnly}`);
  console.log(`Draft treatments:     ${draftsOnly}`);
  console.log(`Total including drafts: ${totalTreatmentsWithDrafts}`);

  // 2. Check if there are other service-related document types
  const types = await sanity.fetch(`array::unique(*[defined(_type)]._type)`);
  console.log("\nAll document types in your dataset:", types);
}

check();
