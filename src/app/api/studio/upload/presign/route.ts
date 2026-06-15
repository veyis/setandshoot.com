import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import {
  MAX_UPLOAD_BYTES,
  TEMP_PREFIX,
  isAllowedMime,
  presignSchema,
  sanitizeFilename,
} from "@/lib/studio/schemas";
import { presignPutUrl } from "@/lib/studio/r2";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { filename, contentType, size } = parsed.data;

  if (!isAllowedMime(contentType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large." }, { status: 413 });
  }

  const tempKey = `${TEMP_PREFIX}${randomUUID()}/${sanitizeFilename(filename)}`;
  try {
    const uploadUrl = await presignPutUrl(tempKey, contentType);
    return NextResponse.json({ uploadUrl, tempKey, contentType });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Could not presign upload.",
        ...(isDev && error instanceof Error ? { detail: error.message } : {}),
      },
      { status: 500 },
    );
  }
}
