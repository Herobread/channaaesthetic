// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { sanityClient } from "@/sanity/lib/sanityClient";
import { defineLive } from "next-sanity/live";

export const { sanityFetch, SanityLive } = defineLive({
  client: sanityClient,
});
