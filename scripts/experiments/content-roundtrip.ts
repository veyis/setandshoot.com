// Phase 2b integration probe: round-trip all 7 story block types through
// updateStudioStoryContent / getStudioStoryContent (DE + EN locales), then
// reverse the blocks and assert EN values follow their block ids.
// Creates an UNPUBLISHED story, probes, deletes it. Run:
//   TSX_TSCONFIG_PATH=scripts/experiments/tsconfig.probe.json \
//     bash scripts/payload-cli.sh run scripts/experiments/content-roundtrip.ts
// (the probe tsconfig maps "server-only" to a stub so tsx can load the
// server-only data module outside Next.js)
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { appendFileSync } from "node:fs";
import { getPayload } from "payload";
import config from "@payload-config";
import { getStudioStoryContent, updateStudioStoryContent } from "@/lib/studio/story-content";
import type { StoryContentInput } from "@/lib/studio/schemas";

const OUT = "scripts/experiments/content-roundtrip.out";
function log(...parts: unknown[]) {
  appendFileSync(
    OUT,
    parts.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ") + "\n",
  );
}

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  log(
    (ok ? "PASS" : "FAIL") +
      ": " +
      name +
      (ok || detail === undefined ? "" : " — " + JSON.stringify(detail)),
  );
  if (!ok) failures += 1;
}

function rt(text: string) {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr" as const,
          textFormat: 0,
          children: [
            { type: "text", text, format: 0, style: "", mode: "normal", detail: 0, version: 1 },
          ],
        },
      ],
    },
  };
}

function rtText(value: any): string {
  return value?.root?.children?.[0]?.children?.[0]?.text ?? "<empty>";
}

async function main() {
  const resolved = await config;
  const stories = resolved.collections.find((c: any) => c.slug === "stories");
  if (stories) (stories.hooks as any).afterChange = []; // no revalidatePath outside Next

  const payload = await getPayload({ config });

  const { docs: photoDocs } = await payload.find({
    collection: "photos",
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (photoDocs.length === 0) {
    log("SKIPPED: no photos in this environment");
    process.exit(0);
  }
  const photoId = photoDocs[0]!.id;
  log("PHOTO", photoId);

  const slug = `studio-2b-roundtrip-${Date.now()}`;
  const created = await payload.create({
    collection: "stories",
    data: { slug, title: "Roundtrip DE", published: false },
    locale: "de",
    overrideAccess: true,
  });
  const id = created.id;
  log("CREATED", id, slug);

  try {
    const input: StoryContentInput = {
      id,
      coverPhotoId: photoId,
      summaryDe: rt("Summary DE"),
      summaryEn: rt("Summary EN"),
      blocks: [
        { blockType: "fullBleedPhoto", photoId },
        { blockType: "diptych", photoLeftId: photoId, photoRightId: photoId, ratio: "60-40" },
        { blockType: "triptych", photoIds: [photoId, photoId, photoId] },
        { blockType: "insetPortrait", photoId, textDe: rt("Inset DE"), textEn: rt("Inset EN") },
        {
          blockType: "sequence",
          photoIds: [photoId, photoId],
          captionDe: "Serie DE",
          captionEn: "Series EN",
        },
        {
          blockType: "pullQuote",
          quoteDe: "Zitat DE",
          quoteEn: "Quote EN",
          attributionDe: "Autor DE",
          attributionEn: "Author EN",
        },
        { blockType: "textParagraph", textDe: rt("Absatz DE"), textEn: rt("Paragraph EN") },
      ],
    };

    await updateStudioStoryContent(input);
    const content = await getStudioStoryContent(id);
    const raw = await payload.findByID({
      collection: "stories",
      id,
      depth: 0,
      locale: "all",
      overrideAccess: true,
    });

    check("read-back exists", content !== null);
    const blocks: any[] = content?.blocks ?? [];
    check("block count 7", blocks.length === 7, blocks.length);
    check(
      "block order matches submission",
      blocks.map((b) => b.blockType).join(",") ===
        "fullBleedPhoto,diptych,triptych,insetPortrait,sequence,pullQuote,textParagraph",
      blocks.map((b) => b.blockType),
    );
    check(
      "new-block ids assigned",
      blocks.every((b) => typeof b.id === "string" && b.id.length > 0),
      blocks.map((b) => b.id),
    );
    check("coverPhotoId persisted", content?.coverPhotoId === photoId, content?.coverPhotoId);
    check("summary DE intact", rtText(content?.summaryDe) === "Summary DE");
    check("summary EN present", rtText(content?.summaryEn) === "Summary EN");
    check(
      "diptych ratio + photos",
      blocks[1]?.ratio === "60-40" &&
        blocks[1]?.photoLeftId === photoId &&
        blocks[1]?.photoRightId === photoId,
    );
    check(
      "triptych photos",
      JSON.stringify(blocks[2]?.photoIds) === JSON.stringify([photoId, photoId, photoId]),
    );
    check("insetPortrait DE intact", rtText(blocks[3]?.textDe) === "Inset DE");
    check("insetPortrait EN present", rtText(blocks[3]?.textEn) === "Inset EN");
    check("sequence caption DE intact", blocks[4]?.captionDe === "Serie DE");
    check("sequence caption EN present", blocks[4]?.captionEn === "Series EN");
    check(
      "pullQuote DE intact",
      blocks[5]?.quoteDe === "Zitat DE" && blocks[5]?.attributionDe === "Autor DE",
    );
    check(
      "pullQuote EN present",
      blocks[5]?.quoteEn === "Quote EN" && blocks[5]?.attributionEn === "Author EN",
    );
    check("textParagraph DE intact", rtText(blocks[6]?.textDe) === "Absatz DE");
    check("textParagraph EN present", rtText(blocks[6]?.textEn) === "Paragraph EN");
    check(
      "raw locale=all title EN self-healed",
      (raw.title as any)?.en === "Roundtrip DE" || (raw.title as any)?.en === "Roundtrip EN",
      raw.title,
    );

    // Second write: same blocks REVERSED (ids from the first read-back); EN
    // values must follow their block ids.
    await updateStudioStoryContent({
      id,
      coverPhotoId: photoId,
      summaryDe: rt("Summary DE"),
      summaryEn: rt("Summary EN"),
      blocks: [...(content?.blocks ?? [])].reverse(),
    });
    const reversed = await getStudioStoryContent(id);
    const rBlocks: any[] = reversed?.blocks ?? [];
    check("reversed block count 7", rBlocks.length === 7, rBlocks.length);
    check(
      "reversed block order",
      rBlocks.map((b) => b.blockType).join(",") ===
        "textParagraph,pullQuote,sequence,insetPortrait,triptych,diptych,fullBleedPhoto",
      rBlocks.map((b) => b.blockType),
    );
    check(
      "ids stable across reorder",
      JSON.stringify(rBlocks.map((b) => b.id)) ===
        JSON.stringify([...blocks].reverse().map((b) => b.id)),
    );
    check("EN followed textParagraph", rtText(rBlocks[0]?.textEn) === "Paragraph EN");
    check(
      "EN followed pullQuote",
      rBlocks[1]?.quoteEn === "Quote EN" && rBlocks[1]?.attributionEn === "Author EN",
    );
    check("EN followed sequence", rBlocks[2]?.captionEn === "Series EN");
    check("EN followed insetPortrait", rtText(rBlocks[3]?.textEn) === "Inset EN");
    check(
      "DE intact after reorder",
      rtText(rBlocks[0]?.textDe) === "Absatz DE" && rBlocks[1]?.quoteDe === "Zitat DE",
    );
  } finally {
    await payload.delete({ collection: "stories", id, overrideAccess: true });
    log("DELETED", id);
  }
  log(failures === 0 ? "RESULT: ALL PASS" : `RESULT: ${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

try {
  await main();
} catch (error) {
  log("PROBE FAILED:", String((error as Error)?.stack ?? error));
  process.exit(1);
}
