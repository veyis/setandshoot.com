import { describe, it, expect } from "vitest";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  TEMP_PREFIX,
  sanitizeFilename,
  isAllowedMime,
  isTempKey,
  presignSchema,
  finalizeSchema,
} from "@/lib/studio/schemas";

describe("upload constants", () => {
  it("caps uploads at 50 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(50 * 1024 * 1024);
  });
  it("allows the four image MIME types", () => {
    expect(ALLOWED_MIME).toEqual(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    expect(isAllowedMime("image/jpeg")).toBe(true);
    expect(isAllowedMime("image/gif")).toBe(false);
    expect(isAllowedMime("")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("strips paths, replaces unsafe chars, keeps the extension", () => {
    expect(sanitizeFilename("My Photo (1).JPG")).toBe("My-Photo-1.JPG");
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("a/b/c.png")).toBe("c.png");
  });
  it("falls back to 'upload' when nothing usable remains", () => {
    expect(sanitizeFilename("")).toBe("upload");
    expect(sanitizeFilename("...")).toBe("upload");
  });
});

describe("isTempKey", () => {
  it("accepts only tmp/ keys without traversal", () => {
    expect(isTempKey("tmp/uuid/photo.jpg")).toBe(true);
    expect(isTempKey("photos/x.jpg")).toBe(false);
    expect(isTempKey("tmp/../photos/x.jpg")).toBe(false);
    expect(isTempKey("tmp//x.jpg")).toBe(false);
    expect(isTempKey(TEMP_PREFIX)).toBe(false); // prefix alone, no object
  });
});

describe("presignSchema", () => {
  it("accepts a well-formed body", () => {
    const r = presignSchema.parse({ filename: "a.jpg", contentType: "image/jpeg", size: 10 });
    expect(r.size).toBe(10);
  });
  it("rejects empty filename / non-positive size", () => {
    expect(() =>
      presignSchema.parse({ filename: "", contentType: "image/jpeg", size: 10 }),
    ).toThrow();
    expect(() =>
      presignSchema.parse({ filename: "a.jpg", contentType: "image/jpeg", size: 0 }),
    ).toThrow();
  });
});

describe("finalizeSchema", () => {
  it("requires a non-empty tempKey", () => {
    expect(finalizeSchema.parse({ tempKey: "tmp/x/a.jpg" }).tempKey).toBe("tmp/x/a.jpg");
    expect(() => finalizeSchema.parse({ tempKey: "" })).toThrow();
  });
});
