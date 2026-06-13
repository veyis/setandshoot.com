import { getPayload } from "@/lib/payload/get-payload";
import type { OrgIdentity } from "@/lib/seo/schema";

export async function getOrgIdentity(): Promise<OrgIdentity> {
  const payload = await getPayload();
  const settings = await payload.findGlobal({ slug: "settings" });
  const org = settings.organization ?? {};
  return {
    instagram: org.instagram ?? undefined,
    linkedin: org.linkedin ?? undefined,
    email: org.email ?? undefined,
    phone: org.phone ?? undefined,
    city: org.city ?? "Bremen",
  };
}
