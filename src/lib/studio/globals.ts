import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { altFor, richTextFor, type LocalizedText } from "@/lib/studio/localized";
import type { DatenschutzInput, ImpressumInput, SettingsInput } from "@/lib/studio/schemas";
import type { Datenschutz, Impressum, Setting } from "@/payload-types";

export type StudioSettings = SettingsInput;

export async function getStudioSettings(): Promise<StudioSettings> {
  const payload = await getPayload({ config });
  const settings = (await payload.findGlobal({
    slug: "settings",
    depth: 0,
    overrideAccess: true,
  })) as Setting;
  return {
    defaultWatermark: Boolean(settings.defaultWatermark),
    accentColor: settings.accentColor ?? "#E63946",
    homeFeaturedCount: settings.homeFeaturedCount ?? 3,
  };
}

export async function updateStudioSettings(input: SettingsInput): Promise<void> {
  const payload = await getPayload({ config });
  // No localized fields on settings — a single locale-free write suffices.
  await payload.updateGlobal({
    slug: "settings",
    overrideAccess: true,
    data: {
      defaultWatermark: input.defaultWatermark,
      accentColor: input.accentColor,
      homeFeaturedCount: input.homeFeaturedCount,
    },
  });
}

export type StudioImpressum = ImpressumInput;

export async function getStudioImpressum(): Promise<StudioImpressum> {
  const payload = await getPayload({ config });
  const impressum = (await payload.findGlobal({
    slug: "impressum",
    depth: 0,
    locale: "all",
    overrideAccess: true,
  })) as Impressum;
  return {
    legalName: impressum.legalName ?? "",
    addressLine1: impressum.addressLine1 ?? "",
    addressLine2: impressum.addressLine2 ?? undefined,
    postalCode: impressum.postalCode ?? "",
    city: impressum.city ?? "",
    country: impressum.country ?? "",
    email: impressum.email ?? "",
    phone: impressum.phone ?? undefined,
    ustIdNr: impressum.ustIdNr ?? undefined,
    responsibleForContent: impressum.responsibleForContent ?? undefined,
    additionalNotesDe: altFor(impressum.additionalNotes as LocalizedText, "de") || undefined,
    additionalNotesEn: altFor(impressum.additionalNotes as LocalizedText, "en") || undefined,
  };
}

export async function updateStudioImpressum(input: ImpressumInput): Promise<void> {
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: "impressum",
    locale: "de",
    overrideAccess: true,
    data: {
      legalName: input.legalName,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      postalCode: input.postalCode,
      city: input.city,
      country: input.country,
      email: input.email,
      phone: input.phone ?? null,
      ustIdNr: input.ustIdNr ?? null,
      responsibleForContent: input.responsibleForContent ?? null,
      additionalNotes: input.additionalNotesDe ?? null,
    },
  });
  // additionalNotes is the only localized field and nothing localized is
  // required → the EN write sends ONLY additionalNotes, and only when set.
  if (input.additionalNotesEn && input.additionalNotesEn !== "") {
    await payload.updateGlobal({
      slug: "impressum",
      locale: "en",
      overrideAccess: true,
      data: { additionalNotes: input.additionalNotesEn },
    });
  }
}

export type StudioDatenschutz = {
  titleDe: string;
  titleEn: string;
  introDe: unknown;
  introEn: unknown;
  bodyDe: unknown;
  bodyEn: unknown;
  lastUpdated: string;
};

export async function getStudioDatenschutz(): Promise<StudioDatenschutz> {
  const payload = await getPayload({ config });
  const datenschutz = (await payload.findGlobal({
    slug: "datenschutz",
    depth: 0,
    locale: "all",
    overrideAccess: true,
  })) as Datenschutz;
  return {
    titleDe: altFor(datenschutz.title as LocalizedText, "de"),
    titleEn: altFor(datenschutz.title as LocalizedText, "en"),
    introDe: richTextFor(datenschutz.intro, "de"),
    introEn: richTextFor(datenschutz.intro, "en"),
    bodyDe: richTextFor(datenschutz.body, "de"),
    bodyEn: richTextFor(datenschutz.body, "en"),
    lastUpdated: datenschutz.lastUpdated ? datenschutz.lastUpdated.slice(0, 10) : "",
  };
}

export async function updateStudioDatenschutz(input: DatenschutzInput): Promise<void> {
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: "datenschutz",
    locale: "de",
    overrideAccess: true,
    data: {
      title: input.titleDe,
      intro: (input.introDe ?? null) as never,
      body: (input.bodyDe ?? null) as never,
      lastUpdated: input.lastUpdated,
    },
  });
  const hasEnglish = Boolean(
    (input.titleEn && input.titleEn !== "") || input.introEn || input.bodyEn,
  );
  if (!hasEnglish) return;
  // title is required+localized → the EN write must carry it (en || de).
  await payload.updateGlobal({
    slug: "datenschutz",
    locale: "en",
    overrideAccess: true,
    data: {
      title: input.titleEn || input.titleDe,
      ...(input.introEn ? { intro: input.introEn as never } : {}),
      ...(input.bodyEn ? { body: input.bodyEn as never } : {}),
    },
  });
}
