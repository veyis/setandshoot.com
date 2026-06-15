import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { finalizeSchema, isAllowedMime, isTempKey } from "@/lib/studio/schemas";
import { deleteObject, getObjectBuffer } from "@/lib/studio/r2";
import { createPhotoFromUpload } from "@/lib/studio/photos";

export const dynamic = "force-dynamic";
// A 50 MB original goes through Sharp (3 sizes + focal crop) here; give it headroom.
export const maxDuration = 60;

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

  const parsed = finalizeSchema.safeParse(body);
  if (!parsed.success || !isTempKey(parsed.data.tempKey)) {
    return NextResponse.json({ error: "Invalid temp key." }, { status: 400 });
  }
  const { tempKey } = parsed.data;
  const name = tempKey.split("/").pop() || "upload";

  try {
    const { buffer, contentType } = await getObjectBuffer(tempKey);
    if (!isAllowedMime(contentType)) {
      await deleteObject(tempKey).catch(() => {});
      return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
    }
    const { id } = await createPhotoFromUpload({
      data: buffer,
      name,
      mimetype: contentType,
      size: buffer.length,
    });
    await deleteObject(tempKey).catch(() => {});
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    await deleteObject(tempKey).catch(() => {});
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
