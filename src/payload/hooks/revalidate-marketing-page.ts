import type { GlobalAfterChangeHook } from "payload";
import { revalidatePath } from "next/cache";

/**
 * Build a global afterChange hook that revalidates the given paths. Skips when
 * there is no Next request context (e.g. the CLI seed sets context.disableRevalidate),
 * where revalidatePath would throw "static generation store missing".
 */
export function revalidateMarketingPage(paths: string[]): GlobalAfterChangeHook {
  return ({ doc, context }) => {
    if (context?.disableRevalidate) return doc;
    for (const path of paths) revalidatePath(path);
    return doc;
  };
}
