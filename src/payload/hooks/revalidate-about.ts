import type { GlobalAfterChangeHook } from "payload";
import { revalidatePath } from "next/cache";

/** Bust the About page (both locales) when the global is saved. */
export const revalidateAbout: GlobalAfterChangeHook = ({ doc, context }) => {
  // Skip when there's no Next request context (e.g. the CLI seed), where
  // revalidatePath would throw "static generation store missing".
  if (context?.disableRevalidate) return doc;
  revalidatePath("/about");
  revalidatePath("/en/about");
  return doc;
};
