import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { env } from "@/env";

export const dynamic = "force-dynamic";

const JWKS_TIMEOUT_MS = 5_000;

export async function GET() {
  const timestamp = new Date().toISOString();

  const postgres: { ok: boolean; message?: string } = { ok: false };
  const neonAuth: { ok: boolean; message?: string } = { ok: false };

  try {
    const payload = await getPayload({ config });
    await payload.find({ collection: "users", limit: 1, depth: 0 });
    postgres.ok = true;
  } catch (cause) {
    postgres.message = cause instanceof Error ? cause.message : "Unknown error";
  }

  try {
    const jwksUrl = `${env.NEON_AUTH_BASE_URL.replace(/\/$/, "")}/.well-known/jwks.json`;
    const response = await fetch(jwksUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(JWKS_TIMEOUT_MS),
    });
    if (response.ok) {
      neonAuth.ok = true;
    } else {
      neonAuth.message = `JWKS endpoint returned HTTP ${response.status}`;
    }
  } catch (cause) {
    neonAuth.message = cause instanceof Error ? cause.message : "Unknown error";
  }

  const ok = postgres.ok && neonAuth.ok;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      timestamp,
      postgres,
      neonAuth,
    },
    { status: ok ? 200 : 503 },
  );
}
