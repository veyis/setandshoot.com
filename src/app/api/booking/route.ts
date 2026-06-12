import { NextResponse } from "next/server";
import { getPayload } from "@/lib/payload/get-payload";
import { bookingInquirySchema } from "@/lib/booking/schema";
import { auth } from "@/lib/auth/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`booking:${clientIp(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a moment." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Honeypot: real users never see or fill `company`. Pretend success so bots
  // get no signal, but never persist the submission.
  const honeypot = (body as { company?: unknown })?.company;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = bookingInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { data: session } = await auth.getSession();
  const customerId = session?.user?.id ?? null;

  try {
    const payload = await getPayload();
    const doc = await payload.create({
      collection: "bookings",
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        organization: parsed.data.organization ?? null,
        message: parsed.data.message,
        locale: parsed.data.locale,
        customerId,
      },
      overrideAccess: true,
    });
    return NextResponse.json({ ok: true, id: doc.id, createdAt: doc.createdAt }, { status: 201 });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Failed to save inquiry.",
        ...(isDev && error instanceof Error ? { detail: error.message } : {}),
      },
      { status: 500 },
    );
  }
}
