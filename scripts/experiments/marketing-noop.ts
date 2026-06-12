// Phase 3 integration probe: marketing globals are LIVE singletons, so the
// verification is a NO-OP write — read aboutPage locale-all, push the same
// values back through getMarketingPage/updateMarketingPage (DE + conditional
// EN write), re-read, and assert the sections are deep-equal. Run:
//   TSX_TSCONFIG_PATH=scripts/experiments/tsconfig.probe.json \
//     bash scripts/payload-cli.sh run scripts/experiments/marketing-noop.ts
// (the probe tsconfig maps "server-only" to a stub so tsx can load the
// server-only data module outside Next.js)
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { appendFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { getPayload } from "payload";
import config from "@payload-config";
import { getMarketingPage, updateMarketingPage } from "@/lib/studio/marketing-pages";

const OUT = "scripts/experiments/marketing-noop.out";
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

const MARKETING_GLOBALS = [
  "aboutPage",
  "servicesPage",
  "contactPage",
  "athletesPage",
  "highlightsPage",
];

/** Payload regenerates array-item ids inside localized serviceOffers items. */
function stripItemIds(items: any): any {
  if (Array.isArray(items)) return items.map(({ id: _id, ...rest }: any) => rest);
  if (items && typeof items === "object") {
    return { de: stripItemIds(items.de ?? []), en: stripItemIds(items.en ?? []) };
  }
  return items;
}

function normalize(sections: any[]): any[] {
  return JSON.parse(JSON.stringify(sections)).map((section: any) =>
    section.blockType === "serviceOffers"
      ? { ...section, items: stripItemIds(section.items) }
      : section,
  );
}

async function main() {
  const resolved = await config;
  for (const slug of MARKETING_GLOBALS) {
    const globalConfig = (resolved.globals as any[]).find((g) => g.slug === slug);
    // no revalidatePath outside Next
    if (globalConfig) globalConfig.hooks = { ...globalConfig.hooks, afterChange: [] };
  }

  const payload = await getPayload({ config });

  const before = (await payload.findGlobal({
    slug: "aboutPage",
    depth: 0,
    locale: "all",
    overrideAccess: true,
  })) as any;
  const beforeSections: any[] = before.sections ?? [];
  if (beforeSections.length === 0) {
    log("SKIPPED: aboutPage has no sections in this environment");
    process.exit(0);
  }
  log("SECTIONS", beforeSections.length, beforeSections.map((s: any) => s.blockType).join(","));

  const page = await getMarketingPage("aboutPage");
  check(
    "editor mapping covers every section",
    page.sections.length === beforeSections.length,
    page.sections.map((s) => s.blockType),
  );

  await updateMarketingPage({ slug: "aboutPage", sections: page.sections });

  const after = (await payload.findGlobal({
    slug: "aboutPage",
    depth: 0,
    locale: "all",
    overrideAccess: true,
  })) as any;
  const afterSections: any[] = after.sections ?? [];

  check("section count unchanged", afterSections.length === beforeSections.length, {
    before: beforeSections.length,
    after: afterSections.length,
  });
  check(
    "section ids unchanged",
    JSON.stringify(afterSections.map((s: any) => s.id)) ===
      JSON.stringify(beforeSections.map((s: any) => s.id)),
    { before: beforeSections.map((s: any) => s.id), after: afterSections.map((s: any) => s.id) },
  );

  const normalizedBefore = normalize(beforeSections);
  const normalizedAfter = normalize(afterSections);
  const equal = isDeepStrictEqual(normalizedBefore, normalizedAfter);
  check("sections deep-equal after no-op write (serviceOffers item ids stripped)", equal);
  if (!equal) {
    log("BEFORE:", JSON.stringify(normalizedBefore, null, 1));
    log("AFTER:", JSON.stringify(normalizedAfter, null, 1));
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
