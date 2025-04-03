// client/src/lib/sanityClient.js
import { createClient } from "@sanity/client";

export const sanity = createClient({
  projectId: "8moip2t5",
  dataset: "production",
  apiVersion: "2025-04-03",
  useCdn: true,
});
