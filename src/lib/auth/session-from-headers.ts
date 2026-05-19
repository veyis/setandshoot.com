import { env } from "@/env";

export type NeonSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
};

type NeonSessionPayload = {
  session: unknown;
  user: NeonSessionUser;
};

/** Resolve Neon Auth session from incoming request headers (used by Payload custom strategy). */
export async function getNeonSessionFromHeaders(
  headers: Headers,
): Promise<NeonSessionPayload | null> {
  const cookie = headers.get("cookie");
  if (!cookie) return null;

  const response = await fetch(`${env.NEXT_PUBLIC_SITE_URL}/api/auth/get-session`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as NeonSessionPayload | null;
  if (!data?.user?.email) return null;

  return data;
}
