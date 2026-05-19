import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthViewClient } from "@/components/auth/auth-view-client";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-ink-muted mb-6 text-sm">
        <Link href="/sign-in" className="hover:text-accent transition-colors">
          ← {t("backToSignIn")}
        </Link>
      </p>
      <AuthViewClient view="forgot-password" />
    </main>
  );
}
