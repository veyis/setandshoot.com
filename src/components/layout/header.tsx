import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderShell } from "./header-shell";
import { LocaleSwitcher } from "./locale-switcher";

type NavItem = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/" as any}
        className="font-display text-base tracking-tight"
      >
        belin akguel
      </Link>
      <nav className="flex gap-6 text-sm max-lg:hidden">
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
      <LocaleSwitcher />
    </HeaderShell>
  );
}
