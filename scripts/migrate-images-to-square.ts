import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import * as dotenv from "dotenv";
import FormData from "form-data";
import { SquareClient, SquareEnvironment } from "square";

dotenv.config({ path: ".env.local" });
dotenv.config();

// 1. Clients
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

const imageBuilder = createImageUrlBuilder(sanity);

function getSanityImageUrl(source: any): string | undefined {
  if (!source?.asset) return undefined;
  return imageBuilder.image(source).auto("format").fit("max").url();
}

async function migrateImages() {
  console.log("🚀 Starting image migration from Sanity to Square...\n");

  // 1. Fetch treatments with images from Sanity
  console.log("📸 Querying Sanity treatments with images...");
  const sanityTreatments: Array<{
    _id: string;
    title: string;
    image: any;
  }> = await sanity.fetch(
    `*[_type == "treatment" && defined(image.asset)]{
      _id,
      title,
      image
    }`,
  );

  console.log(`   Found ${sanityTreatments.length} treatments with images.\n`);

  if (sanityTreatments.length === 0) {
    console.log("ℹ️ No images found to migrate.");
    return;
  }

  // 2. Fetch all existing Square services to match by name
  console.log("📦 Fetching existing Square services to map image targets...");
  const catalogSearch = await square.catalog.search({
    objectTypes: ["ITEM"],
  });

  const squareItems = (catalogSearch.objects || []).filter(
    (obj: any) =>
      obj.type === "ITEM" &&
      obj.itemData?.productType === "APPOINTMENTS_SERVICE" &&
      !obj.isDeleted,
  );

  console.log(`   Found ${squareItems.length} services in Square.\n`);

  // Build name-to-itemId map (trimmed, lowercase for clean matching)
  const squareItemMap = new Map<string, any>();
  squareItems.forEach((item: any) => {
    if (item.itemData?.name) {
      squareItemMap.set(item.itemData.name.trim().toLowerCase(), item);
    }
  });

  // 3. Download from Sanity CDN & upload to Square
  let uploadedCount = 0;
  let skippedCount = 0;

  for (const [index, treatment] of sanityTreatments.entries()) {
    const cleanTitle = (treatment.title || "").trim().toLowerCase();
    const targetItem = squareItemMap.get(cleanTitle);

    if (!targetItem) {
      console.warn(
        `⚠️ [${index + 1}/${sanityTreatments.length}] Skipping "${treatment.title}": No matching Square service found.`,
      );
      skippedCount++;
      continue;
    }

    // If the Square item already has an image, skip re-uploading
    if (
      targetItem.itemData?.imageIds &&
      targetItem.itemData.imageIds.length > 0
    ) {
      console.log(
        `⏩ [${index + 1}/${sanityTreatments.length}] "${treatment.title}" already has an image in Square. Skipping.`,
      );
      continue;
    }

    const cdnUrl = getSanityImageUrl(treatment.image);
    if (!cdnUrl) {
      skippedCount++;
      continue;
    }

    try {
      console.log(
        `⬇️ [${index + 1}/${sanityTreatments.length}] Downloading: ${treatment.title}...`,
      );

      // Download binary from Sanity CDN
      const imgRes = await fetch(cdnUrl);
      if (!imgRes.ok) {
        throw new Error(
          `Failed to download image from CDN (${imgRes.statusText})`,
        );
      }

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : "jpg";
      const filename = `${targetItem.id}.${ext}`;

      // Build multipart form payload for Square CreateCatalogImage API
      const form = new FormData();
      const requestPayload = {
        idempotency_key: crypto.randomUUID(),
        object_id: targetItem.id, // Links image directly to this item
        image: {
          type: "IMAGE",
          id: `#img_${index}`,
          image_data: {
            name: `${treatment.title} Cover`,
            caption: treatment.title,
          },
        },
      };

      form.append("request", JSON.stringify(requestPayload), {
        contentType: "application/json",
      });
      form.append("image_file", buffer, {
        filename,
        contentType,
      });

      // Post directly to Square's Catalog Images endpoint
      const baseUrl =
        process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
          ? "https://connect.squareup.com"
          : "https://connect.squareupsandbox.com";

      const uploadRes = await fetch(`${baseUrl}/v2/catalog/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          ...form.getHeaders(),
        },
        body: form.getBuffer(),
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Square Image API error: ${errorText}`);
      }

      console.log(`   ✅ Attached image to "${treatment.title}"`);
      uploadedCount++;

      // Small 250ms throttle to stay comfortably below Square rate limits
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch (err: any) {
      console.error(`   ❌ Failed for "${treatment.title}":`, err.message);
    }
  }

  console.log(
    `\n🎉 Done! Uploaded: ${uploadedCount}, Skipped: ${skippedCount}. All images are now in Square.`,
  );
}

migrateImages().catch((err) => {
  console.error("❌ Fatal migration error:", err);
  process.exit(1);
});
