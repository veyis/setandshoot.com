import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/studio/settings-form";
import { getStudioSettings } from "@/lib/studio/globals";

export const dynamic = "force-dynamic";

export default async function StudioSettingsPage() {
  const [t, settings] = await Promise.all([getTranslations("studio"), getStudioSettings()]);

  return (
    <main>
      <h2 className="font-display mb-4 text-xl tracking-tight">{t("settingsTitle")}</h2>
      <SettingsForm settings={settings} />
    </main>
  );
}
