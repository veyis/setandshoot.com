import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createPhotoFromUpload } from "@/lib/studio/photos";
import { MAX_UPLOAD_BYTES } from "@/lib/studio/schemas";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const WATERMARK_LEVELS = ["none", "light", "standard"] as const;
type Watermark = (typeof WATERMARK_LEVELS)[number];
// 4 MB — Vercel rejects serverless request bodies over ~4.5 MB platform-side, so a higher
// limit here would be a false promise. Follow-up: presigned direct-to-R2 upload.
const MAX_BYTES = MAX_UPLOAD_BYTES;

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 4 MB)." }, { status: 413 });
  }

  const rawWatermark = form.get("watermark");
  const watermark: Watermark = WATERMARK_LEVELS.includes(rawWatermark as Watermark)
    ? (rawWatermark as Watermark)
    : "none";

  try {
    const { id } = await createPhotoFromUpload({
      data: Buffer.from(await file.arrayBuffer()),
      name: file.name,
      mimetype: file.type,
      size: file.size,
      watermark,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Upload failed.",
        ...(isDev && error instanceof Error ? { detail: error.message } : {}),
      },
      { status: 500 },
    );
  }
}
