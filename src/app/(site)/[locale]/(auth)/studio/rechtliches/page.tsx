import { getTranslations } from "next-intl/server";
import { DatenschutzForm } from "@/components/studio/datenschutz-form";
import { ImpressumForm } from "@/components/studio/impressum-form";
import { getStudioDatenschutz, getStudioImpressum } from "@/lib/studio/globals";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudioLegalPage() {
  // Layouts render in parallel with pages — re-check here, not just in the layout.
  await requireAdmin("/studio");
  const [t, impressum, datenschutz] = await Promise.all([
    getTranslations("studio"),
    getStudioImpressum(),
    getStudioDatenschutz(),
  ]);

  return (
    <main className="space-y-10">
      <section>
        <h2 className="font-display mb-4 text-xl tracking-tight">{t("impressumTitle")}</h2>
        <ImpressumForm impressum={impressum} />
      </section>
      <section>
        <h2 className="font-display mb-4 text-xl tracking-tight">{t("datenschutzTitle")}</h2>
        <DatenschutzForm datenschutz={datenschutz} adminUrl="/admin/globals/datenschutz" />
      </section>
    </main>
  );
}
