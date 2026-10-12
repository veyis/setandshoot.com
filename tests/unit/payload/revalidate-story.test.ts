import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { revalidateStory } from "@/payload/hooks/revalidate-story";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("story publication cache invalidation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refreshes German and English listings, homepages, sitemap and renamed URLs", () => {
    const doc = { slug: "new-story", published: false };
    revalidateStory({
      doc,
      previousDoc: { slug: "old-story" },
      context: {},
    } as unknown as Parameters<typeof revalidateStory>[0]);
    const paths = vi.mocked(revalidatePath).mock.calls.map(([path]) => path);
    for (const prefix of ["", "/de", "/en"]) {
      expect(paths).toContain(prefix || "/");
      expect(paths).toContain(`${prefix}/stories`);
      expect(paths).toContain(`${prefix}/stories/new-story`);
      expect(paths).toContain(`${prefix}/stories/old-story`);
    }
    expect(paths).toContain("/sitemap.xml");
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("preserves the CLI opt-out because no Next request context exists", () => {
    const doc = { slug: "test", published: false };
    expect(
      revalidateStory({ doc, context: { disableRevalidate: true } } as unknown as Parameters<
        typeof revalidateStory
      >[0]),
    ).toBe(doc);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
