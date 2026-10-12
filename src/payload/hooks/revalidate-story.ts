import type { CollectionAfterChangeHook } from "payload";
import { revalidatePath } from "next/cache";

/** Bust story list + detail when a story is saved */
export const revalidateStory: CollectionAfterChangeHook = ({ doc, previousDoc, context }) => {
  // Skip when there's no Next request context (e.g. CLI seed sets
  // context.disableRevalidate), where revalidatePath throws.
  if (context?.disableRevalidate) return doc;

  // The homepage also features stories; invalidate every locale destination
  // (including the rewritten /en route) and the published-story sitemap.
  for (const prefix of ["", "/de", "/en"]) {
    revalidatePath(prefix || "/");
    revalidatePath(`${prefix}/stories`);
  }
  revalidatePath("/sitemap.xml");

  const slugs = new Set(
    [doc?.slug, previousDoc?.slug].filter((s): s is string => typeof s === "string"),
  );
  for (const slug of slugs) {
    for (const prefix of ["", "/de", "/en"]) {
      revalidatePath(`${prefix}/stories/${slug}`);
    }
  }

  return doc;
};
