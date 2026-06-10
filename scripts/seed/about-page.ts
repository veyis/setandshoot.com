/**
 * Seed the aboutPage global from the next-intl default copy.
 * Idempotent: skips if the global already has sections (never overwrites edits).
 *
 * Usage: pnpm seed:about-page
 */
import fs from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";
import type { EditorialProseBlock } from "@/payload-types";

type Messages = {
  pages: { common: { label: string; cta: string }; about: { title: string; intro: string } };
  home: {
    about: {
      eyebrow: string;
      title: string;
      body1: string;
      body2: string;
      pullQuote: string;
      cameraCaption: string;
      publications: string;
      clients: string;
      availability: string;
    };
  };
};

async function loadMessages(locale: "de" | "en"): Promise<Messages> {
  const raw = await fs.readFile(path.join(process.cwd(), "src/messages", `${locale}.json`), "utf8");
  return JSON.parse(raw) as Messages;
}

/** Minimal lexical richText value holding one paragraph. */
function richParagraph(text: string): NonNullable<EditorialProseBlock["body1"]> {
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

function sectionsFor(m: Messages) {
  return [
    {
      blockType: "pageHeader" as const,
      label: m.pages.common.label,
      title: m.pages.about.title,
      intro: m.pages.about.intro,
    },
    {
      blockType: "portraitFigure" as const,
      caption: m.home.about.cameraCaption,
    },
    {
      blockType: "editorialProse" as const,
      eyebrow: m.home.about.eyebrow,
      title: m.home.about.title.replace(" / ", "\n"),
      body1: richParagraph(m.home.about.body1),
      pullQuote: m.home.about.pullQuote,
      body2: richParagraph(m.home.about.body2),
      credits: [m.home.about.publications, m.home.about.clients, m.home.about.availability].join(
        "\n",
      ),
    },
    {
      blockType: "ctaLink" as const,
      label: m.pages.common.cta,
      target: "/contact" as const,
    },
  ];
}

const payload = await getPayload({ config });

const existing = await payload.findGlobal({ slug: "aboutPage", locale: "de", depth: 0 });
if (existing.sections?.length) {
  console.log("aboutPage already has sections — skipping (no overwrite).");
  await payload.destroy();
  process.exit(0);
}

const de = await loadMessages("de");
const en = await loadMessages("en");

// Pass 1: write the German content (default locale) — this creates the block rows + ids.
// disableRevalidate: the afterChange hook's revalidatePath can't run outside a Next request.
await payload.updateGlobal({
  slug: "aboutPage",
  locale: "de",
  data: { sections: sectionsFor(de) },
  context: { disableRevalidate: true },
});

// Pass 2: re-read to get the generated block ids, then write the English localized
// values onto the SAME rows (matching by id preserves order + per-locale fields).
const seeded = await payload.findGlobal({ slug: "aboutPage", locale: "de", depth: 0 });
const enSections = sectionsFor(en).map((section, i) => ({
  ...section,
  id: (seeded.sections ?? [])[i]?.id,
}));
await payload.updateGlobal({
  slug: "aboutPage",
  locale: "en",
  data: { sections: enSections },
  context: { disableRevalidate: true },
});

console.log("Seeded aboutPage (de + en).");
await payload.destroy();
