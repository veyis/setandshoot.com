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

  // redirect:"error" — if NEXT_PUBLIC_SITE_URL is not the canonical origin, the
  // redirect hop would silently strip the cookie (Node fetch drops cookies on
  // cross-origin redirects) and every CMS login would bounce-loop. Fail loudly
  // instead so the misconfiguration shows up in runtime logs.
  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_SITE_URL}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
      redirect: "error",
    });
  } catch (error) {
    console.error(
      `[neon-auth] get-session fetch failed for ${env.NEXT_PUBLIC_SITE_URL} — ` +
        `is NEXT_PUBLIC_SITE_URL the canonical origin (no redirect)?`,
      error,
    );
    return null;
  }

  if (!response.ok) return null;

  // Guard against a non-JSON body (network blip, proxy error). A throw here
  // would propagate through Payload's auth strategy and break CMS login.
  let data: NeonSessionPayload | null;
  try {
    data = (await response.json()) as NeonSessionPayload | null;
  } catch (error) {
    console.error("[neon-auth] get-session returned a non-JSON body", error);
    return null;
  }
  if (!data?.user?.email) return null;

  return data;
}
