import { getTranslations } from "next-intl/server";
import { AuthViewClient } from "@/components/auth/auth-view-client";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const safeNext = safeRedirectPath(next);
  const t = await getTranslations("auth");
  return (
    <main className="mx-auto max-w-md px-4 pt-32 pb-16">
      {error === "admin_required" ? (
        <p className="text-accent mb-6 text-sm">{t("adminRequired")}</p>
      ) : null}
      {safeNext.startsWith("/admin") ? (
        <p className="text-ink-muted mb-6 text-sm">{t("adminNext")}</p>
      ) : null}
      <AuthViewClient view="sign-in" nextPath={safeNext} />
    </main>
  );
}
