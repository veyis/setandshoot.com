import type { AuthStrategy, Payload } from "payload";
import { getNeonSessionFromHeaders } from "@/lib/auth/session-from-headers";
import { isAdminEmail } from "@/lib/auth/admin-emails";

function cmsRoleFromNeon(neonRole: string | null | undefined, email: string): "admin" | null {
  if (neonRole === "admin" || isAdminEmail(email)) return "admin";
  return null;
}

async function ensurePayloadCmsUser(
  payload: Payload,
  neonUser: { email: string; name?: string | null; role?: string | null },
) {
  const email = neonUser.email.trim().toLowerCase();
  const role = cmsRoleFromNeon(neonUser.role, email);
  if (!role) return null;

  const { docs } = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const existing = docs[0];
  if (existing) {
    if (existing.role !== role || existing.name !== (neonUser.name ?? existing.name)) {
      return payload.update({
        collection: "users",
        id: existing.id,
        data: { role, name: neonUser.name ?? existing.name },
        overrideAccess: true,
      });
    }
    return existing;
  }

  return payload.create({
    collection: "users",
    data: {
      email,
      name: neonUser.name ?? undefined,
      role,
    },
    overrideAccess: true,
  });
}

export const neonAuthStrategy: AuthStrategy = {
  name: "neon",
  authenticate: async ({ headers, payload }) => {
    const session = await getNeonSessionFromHeaders(headers);
    if (!session?.user) return { user: null };

    const user = await ensurePayloadCmsUser(payload, session.user);
    if (!user) return { user: null };

    return {
      user: {
        ...user,
        collection: "users",
        _strategy: "neon",
      },
    };
  },
};
