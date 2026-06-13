import { cache } from "react";
import { getPayload } from "@/lib/payload/get-payload";
import type { OrgIdentity } from "@/lib/seo/schema";

export const getOrgIdentity = cache(async (): Promise<OrgIdentity> => {
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
});
