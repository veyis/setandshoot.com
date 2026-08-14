import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderAuthButton } from "@/components/auth/header-auth-button";
import { HeaderShell } from "./header-shell";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";

type NavItem = {
  href: any;
  label: string;
};

export async function Header() {
  const t = await getTranslations("nav");

  const items: NavItem[] = [
    { href: "/stories", label: t("stories") },
    { href: "/highlights", label: t("highlights") },
    { href: "/athletes", label: t("athletes") },
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/journal", label: t("journal") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <HeaderShell>
      <Link href={"/" as any} className="font-display text-base tracking-tight">
        belin akguel
      </Link>
      <nav aria-label={t("primary")} className="flex gap-6 text-sm max-lg:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-ink-muted hover:text-ink transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <HeaderAuthButton
          signInLabel={t("signIn")}
          accountLabel={t("account")}
          adminLabel={t("adminOption")}
          logOutLabel={t("logOut")}
        />
        <LocaleSwitcher />
        <MobileNav
          items={items}
          signInLabel={t("signIn")}
          accountLabel={t("account")}
          menuLabel={t("menu")}
          closeLabel={t("close")}
        />
      </div>
    </HeaderShell>
  );
}
