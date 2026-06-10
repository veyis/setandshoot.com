import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { setRequestLocale } from "next-intl/server";

// Catch-all for unknown paths under a locale. Triggers the localized
// not-found.tsx so the 404 renders inside the site chrome (Header/Footer),
// instead of falling back to the bare Next.js default page.
export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  notFound();
}
