// One-off Phase 2b experiment: how does Payload 3.84 handle localized
// subfields inside (non-localized) block arrays on update?
// Creates an UNPUBLISHED story, probes, deletes it. Run:
//   bash scripts/payload-cli.sh run scripts/experiments/block-locale.ts

import "dotenv/config";
import { appendFileSync } from "node:fs";
import { getPayload } from "payload";
import config from "@payload-config";

const OUT = "scripts/experiments/block-locale.out";
function log(...parts: unknown[]) {
  appendFileSync(
    OUT,
    parts.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ") + "\n",
  );
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

function dump(label: string, layout: any) {
  log(
    label,
    JSON.stringify(
      (layout ?? []).map((b: any) => ({
        id: b.id,
        blockType: b.blockType,
        // localized subfields come back as {de,en} objects at locale=all
        text:
          b.text && (b.text.de || b.text.en)
            ? { de: rtText(b.text.de), en: rtText(b.text.en) }
            : b.text
              ? rtText(b.text)
              : undefined,
        quote: b.quote,
        attribution: b.attribution,
      })),
      null,
      1,
    ),
  );
}

async function main() {
  const resolved = await config;
  const stories = resolved.collections.find((c: any) => c.slug === "stories");
  if (stories) (stories.hooks as any).afterChange = []; // no revalidatePath outside Next

  const payload = await getPayload({ config });
  const slug = `studio-2b-exp-${Date.now()}`;
  const created = await payload.create({
    collection: "stories",
    data: { slug, title: "Experiment DE", published: false },
    locale: "de",
    overrideAccess: true,
  });
  const id = created.id;
  log("CREATED", id, slug);

  try {
    // Step A: write layout in DE
    const afterDe = await payload.update({
      collection: "stories",
      id,
      locale: "de",
      overrideAccess: true,
      data: {
        layout: [
          { blockType: "textParagraph", text: rt("Absatz DE") } as any,
          { blockType: "pullQuote", quote: "Zitat DE", attribution: "Autor DE" } as any,
        ],
      },
    });
    const ids = (afterDe.layout ?? []).map((b: any) => b.id);
    log("A: DE write ok, block ids:", JSON.stringify(ids));

    // Step B: write EN values for the SAME blocks (ids included)
    await payload.update({
      collection: "stories",
      id,
      locale: "en",
      overrideAccess: true,
      data: {
        // FINDING 1: locale-en updates MUST include required localized fields
        // (title) when they don't exist yet in EN — otherwise ValidationError.
        title: "Experiment EN",
        layout: [
          { id: ids[0], blockType: "textParagraph", text: rt("Paragraph EN") } as any,
          {
            id: ids[1],
            blockType: "pullQuote",
            quote: "Quote EN",
            attribution: "Author EN",
          } as any,
        ],
      },
    });
    const allAfterEn = await payload.findByID({
      collection: "stories",
      id,
      locale: "all",
      depth: 0,
      overrideAccess: true,
    });
    dump("B: locale=all after EN write:", allAfterEn.layout);

    // Step C: reorder in DE (swap), sending only DE values + ids
    await payload.update({
      collection: "stories",
      id,
      locale: "de",
      overrideAccess: true,
      data: {
        layout: [
          { id: ids[1], blockType: "pullQuote", quote: "Zitat DE", attribution: "Autor DE" } as any,
          { id: ids[0], blockType: "textParagraph", text: rt("Absatz DE") } as any,
        ],
      },
    });
    const allAfterReorder = await payload.findByID({
      collection: "stories",
      id,
      locale: "all",
      depth: 0,
      overrideAccess: true,
    });
    dump(
      "C: locale=all after DE reorder (EN must survive, follow blocks):",
      allAfterReorder.layout,
    );

    // Step D: delete one block + add a new one in DE
    const keepId = (allAfterReorder.layout as any[])[0].id;
    await payload.update({
      collection: "stories",
      id,
      locale: "de",
      overrideAccess: true,
      data: {
        layout: [
          {
            id: keepId,
            blockType: "pullQuote",
            quote: "Zitat DE v2",
            attribution: "Autor DE",
          } as any,
          { blockType: "textParagraph", text: rt("Neuer Absatz DE") } as any,
        ],
      },
    });
    const allAfterEdit = await payload.findByID({
      collection: "stories",
      id,
      locale: "all",
      depth: 0,
      overrideAccess: true,
    });
    dump("D: locale=all after delete+add in DE:", allAfterEdit.layout);
  } finally {
    await payload.delete({ collection: "stories", id, overrideAccess: true });
    log("DELETED", id);
  }
  process.exit(0);
}

try {
  await main();
} catch (error) {
  log("EXPERIMENT FAILED:", String((error as Error)?.stack ?? error));
  process.exit(1);
}
