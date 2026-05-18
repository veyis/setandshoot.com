import type { CollectionAfterChangeHook } from "payload";
import { revalidatePath } from "next/cache";

/** Bust story list + detail when a story is saved */
export const revalidateStory: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  revalidatePath("/stories");
  revalidatePath("/en/stories");

  const slugs = new Set(
    [doc?.slug, previousDoc?.slug].filter((s): s is string => typeof s === "string"),
  );
  for (const slug of slugs) {
    revalidatePath(`/stories/${slug}`);
    revalidatePath(`/en/stories/${slug}`);
  }

  return doc;
};
