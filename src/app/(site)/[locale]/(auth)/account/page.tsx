import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountViewClient } from "@/components/auth/account-view-client";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const quickLinkClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const t = await getTranslations("account");

  return (
    <main className="mx-auto max-w-2xl px-4 pt-32 pb-16">
      <header className="mb-10">
        <h1 className="font-display text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-ink-muted mt-1 text-sm">{t("signedInAs", { email: user.email })}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
             
            href={"/account/bookings" as any}
            className={quickLinkClass}
          >
            {t("bookings")}
          </Link>
          {user.role === "admin" ? (
            <>
              <Link
                 
                href={"/studio" as any}
                className={quickLinkClass}
              >
                {t("openStudio")}
              </Link>
              <Link
                 
                href={"/admin" as any}
                className={quickLinkClass}
              >
                {t("openCms")}
              </Link>
            </>
          ) : null}
        </div>
      </header>
      <AccountViewClient />
    </main>
  );
}
