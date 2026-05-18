import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload/payload.config";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const payload = await getPayload({ config });
    // Touching any collection forces a Postgres roundtrip via the Payload-managed pool.
    await payload.find({ collection: "users", limit: 1, depth: 0 });
    return NextResponse.json({
      status: "ok",
      timestamp,
      postgres: { ok: true },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown error";
    return NextResponse.json(
      {
        status: "degraded",
        timestamp,
        postgres: { ok: false, message },
      },
      { status: 503 },
    );
  }
}
