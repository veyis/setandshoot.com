import { NextResponse } from "next/server";
import { bookingInquirySchema } from "@/lib/booking/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";

export async function POST(request: Request) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Booking storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bookingInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_inquiries")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization ?? null,
      message: parsed.data.message,
      locale: parsed.data.locale,
    })
    .select("id, created_at")
    .single();

  if (error) {
    const missingTable = error.code === "PGRST205" || error.message.includes("booking_inquiries");
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: missingTable
          ? "Database schema not applied. Run pnpm supabase:db-push on the server."
          : "Failed to save inquiry.",
        ...(isDev && { code: error.code, detail: error.message }),
      },
      { status: missingTable ? 503 : 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data.id, createdAt: data.created_at }, { status: 201 });
}
