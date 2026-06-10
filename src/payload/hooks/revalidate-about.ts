import type { GlobalAfterChangeHook } from "payload";
import { revalidatePath } from "next/cache";

/** Bust the About page (both locales) when the global is saved. */
export const revalidateAbout: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePath("/about");
  revalidatePath("/en/about");
  return doc;
};
