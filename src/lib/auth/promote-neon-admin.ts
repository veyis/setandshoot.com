import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { isAdminEmail } from "@/lib/auth/admin-emails";

/** Grant Neon Auth `admin` role when email is listed in ADMIN_EMAILS. */
export async function promoteNeonAdminByEmail(email: string): Promise<boolean> {
  if (!isAdminEmail(email)) return false;

  const payload = await getPayload({ config });
  const result = await payload.db.drizzle.execute(
    sql`
      UPDATE neon_auth."user"
      SET role = 'admin', "emailVerified" = true
      WHERE lower(email) = lower(${email})
        AND role IS DISTINCT FROM 'admin'
    `,
  );

  return Number(result.rowCount ?? 0) > 0;
}
