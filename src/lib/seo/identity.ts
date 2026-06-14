import { cache } from "react";
import { getPayload } from "@/lib/payload/get-payload";
import type { OrgIdentity } from "@/lib/seo/schema";

export const getOrgIdentity = cache(async (): Promise<OrgIdentity> => {
  try {
    const payload = await getPayload();
    const settings = await payload.findGlobal({ slug: "settings" });
    const org = (settings as { organization?: OrgIdentity }).organization ?? {};
    return {
      instagram: org.instagram ?? undefined,
      linkedin: org.linkedin ?? undefined,
      email: org.email ?? undefined,
      phone: org.phone ?? undefined,
      city: org.city ?? "Bremen",
    };
  } catch (err) {
    console.warn(
      "[getOrgIdentity] settings read failed; using empty identity (pending migration?)",
      err,
    );
    return { city: "Bremen" };
  }
});
