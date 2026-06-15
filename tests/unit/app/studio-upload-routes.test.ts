// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/server", () => ({ auth: { getSession: vi.fn() } }));
vi.mock("@/lib/studio/r2", () => ({
  presignPutUrl: vi.fn(),
  getObjectBuffer: vi.fn(),
  deleteObject: vi.fn(),
}));
vi.mock("@/lib/studio/photos", () => ({ createPhotoFromUpload: vi.fn() }));

import { auth } from "@/lib/auth/server";
import { presignPutUrl, getObjectBuffer, deleteObject } from "@/lib/studio/r2";
import { createPhotoFromUpload } from "@/lib/studio/photos";
import { POST as presignPOST } from "@/app/api/studio/upload/presign/route";
import { POST as finalizePOST } from "@/app/api/studio/upload/finalize/route";

const getSession = vi.mocked(auth.getSession);
const asAdmin = () => getSession.mockResolvedValue({ data: { user: { role: "admin" } } } as never);
const asGuest = () => getSession.mockResolvedValue({ data: null } as never);

function jsonReq(body: unknown) {
  return new Request("http://test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // deleteObject must return a Promise so .catch() works in the route
  vi.mocked(deleteObject).mockResolvedValue(undefined);
});

describe("POST /api/studio/upload/presign", () => {
  it("rejects non-admins with 403", async () => {
    asGuest();
    const res = await presignPOST(
      jsonReq({ filename: "a.jpg", contentType: "image/jpeg", size: 10 }),
    );
    expect(res.status).toBe(403);
    expect(presignPutUrl).not.toHaveBeenCalled();
  });

  it("rejects unsupported MIME with 415", async () => {
    asAdmin();
    const res = await presignPOST(
      jsonReq({ filename: "a.gif", contentType: "image/gif", size: 10 }),
    );
    expect(res.status).toBe(415);
  });

  it("rejects oversize with 413", async () => {
    asAdmin();
    const res = await presignPOST(
      jsonReq({ filename: "a.jpg", contentType: "image/jpeg", size: 51 * 1024 * 1024 }),
    );
    expect(res.status).toBe(413);
  });

  it("returns a tmp/ key and presigned url for a valid request", async () => {
    asAdmin();
    vi.mocked(presignPutUrl).mockResolvedValue("https://r2.example/upload-url");
    const res = await presignPOST(
      jsonReq({ filename: "My Photo.jpg", contentType: "image/jpeg", size: 1234 }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tempKey).toMatch(/^tmp\/.+\/My-Photo\.jpg$/);
    expect(json.uploadUrl).toBe("https://r2.example/upload-url");
    expect(presignPutUrl).toHaveBeenCalledWith(expect.stringMatching(/^tmp\//), "image/jpeg");
  });
});

describe("POST /api/studio/upload/finalize", () => {
  it("rejects non-admins with 403", async () => {
    asGuest();
    const res = await finalizePOST(jsonReq({ tempKey: "tmp/uuid/a.jpg" }));
    expect(res.status).toBe(403);
    expect(getObjectBuffer).not.toHaveBeenCalled();
  });

  it("rejects a non-tmp/ key with 400 and never reads the object", async () => {
    asAdmin();
    const res = await finalizePOST(jsonReq({ tempKey: "photos/secret.jpg" }));
    expect(res.status).toBe(400);
    expect(getObjectBuffer).not.toHaveBeenCalled();
  });

  it("creates a photo from the temp object, deletes it, returns the id", async () => {
    asAdmin();
    vi.mocked(getObjectBuffer).mockResolvedValue({
      buffer: Buffer.from("img"),
      contentType: "image/jpeg",
    });
    vi.mocked(createPhotoFromUpload).mockResolvedValue({ id: 42 });
    const res = await finalizePOST(jsonReq({ tempKey: "tmp/uuid/photo.jpg" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe(42);
    expect(createPhotoFromUpload).toHaveBeenCalledWith(
      expect.objectContaining({ name: "photo.jpg", mimetype: "image/jpeg", size: 3 }),
    );
    expect(deleteObject).toHaveBeenCalledWith("tmp/uuid/photo.jpg");
  });

  it("rejects an unexpected stored MIME with 415 and cleans up", async () => {
    asAdmin();
    vi.mocked(getObjectBuffer).mockResolvedValue({
      buffer: Buffer.from("x"),
      contentType: "application/zip",
    });
    const res = await finalizePOST(jsonReq({ tempKey: "tmp/uuid/evil.zip" }));
    expect(res.status).toBe(415);
    expect(createPhotoFromUpload).not.toHaveBeenCalled();
    expect(deleteObject).toHaveBeenCalledWith("tmp/uuid/evil.zip");
  });
});
