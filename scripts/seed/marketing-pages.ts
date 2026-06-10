/**
 * Seed the marketing page globals (contactPage, servicesPage, athletesPage,
 * highlightsPage) from the next-intl default copy. Each global gets a single
 * pageHeader block.
 *
 * Idempotent per-global: skips any global that already has sections (never
 * overwrites edits) and continues with the rest.
 *
 * Usage: pnpm seed:marketing-pages
 */
import fs from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";

type Messages = {
  contact: { title: string; intro: string };
  services: { title: string; intro: string };
  pages: {
    common: { label: string };
    athletes: { title: string; intro: string };
    highlights: { title: string; intro: string };
  };
};

type MarketingSlug = "contactPage" | "servicesPage" | "athletesPage" | "highlightsPage";
type Header = { label?: string; title: string; intro: string };

const PAGES: { slug: MarketingSlug; header: (m: Messages) => Header }[] = [
  {
    slug: "contactPage",
    header: (m) => ({ title: m.contact.title, intro: m.contact.intro }),
  },
  {
    slug: "servicesPage",
    header: (m) => ({ title: m.services.title, intro: m.services.intro }),
  },
  {
    slug: "athletesPage",
    header: (m) => ({
      label: m.pages.common.label,
      title: m.pages.athletes.title,
      intro: m.pages.athletes.intro,
    }),
  },
  {
    slug: "highlightsPage",
    header: (m) => ({
      label: m.pages.common.label,
      title: m.pages.highlights.title,
      intro: m.pages.highlights.intro,
    }),
  },
];

async function loadMessages(locale: "de" | "en"): Promise<Messages> {
  const raw = await fs.readFile(path.join(process.cwd(), "src/messages", `${locale}.json`), "utf8");
  return JSON.parse(raw) as Messages;
}

function blockFor({ label, title, intro }: Header) {
  return { blockType: "pageHeader" as const, ...(label ? { label } : {}), title, intro };
}

const payload = await getPayload({ config });

const de = await loadMessages("de");
const en = await loadMessages("en");

for (const { slug, header } of PAGES) {
  const existing = await payload.findGlobal({ slug, locale: "de", depth: 0 });
  if (existing.sections?.length) {
    console.log(`${slug} already has sections — skipping (no overwrite).`);
    continue;
  }

  // Pass 1: write the German content (default locale) — creates the block row + id.
  // disableRevalidate: the afterChange hook's revalidatePath can't run outside a Next request.
  await payload.updateGlobal({
    slug,
    locale: "de",
    data: { sections: [blockFor(header(de))] },
    context: { disableRevalidate: true },
  });

  // Pass 2: re-read to get the generated block id, then write the English localized
  // values onto the SAME row (matching by id preserves order + per-locale fields).
  const seeded = await payload.findGlobal({ slug, locale: "de", depth: 0 });
  const enSections = [{ ...blockFor(header(en)), id: (seeded.sections ?? [])[0]?.id }];
  await payload.updateGlobal({
    slug,
    locale: "en",
    data: { sections: enSections },
    context: { disableRevalidate: true },
  });

  console.log(`Seeded ${slug} (de + en).`);
}

await payload.destroy();
