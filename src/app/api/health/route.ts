import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          timestamp,
          supabase: { ok: false, message: error.message },
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp,
      supabase: { ok: true, url: process.env.NEXT_PUBLIC_SUPABASE_URL },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown error";
    return NextResponse.json(
      {
        status: "degraded",
        timestamp,
        supabase: { ok: false, message },
      },
      { status: 503 },
    );
  }
}
