import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/studio/settings-form";
import { getStudioSettings } from "@/lib/studio/globals";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudioSettingsPage() {
  // Layouts render in parallel with pages — re-check here, not just in the layout.
  await requireAdmin("/studio");
  const [t, settings] = await Promise.all([getTranslations("studio"), getStudioSettings()]);

  return (
    <main>
      <h2 className="font-display mb-4 text-xl tracking-tight">{t("settingsTitle")}</h2>
      <SettingsForm settings={settings} />
    </main>
  );
}
