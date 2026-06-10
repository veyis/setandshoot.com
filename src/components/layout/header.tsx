import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderShell } from "./header-shell";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";

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
      <div className="flex items-center gap-4">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/sign-in" as any}
          aria-label={t("signIn")}
          title={t("signIn")}
          className="border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex items-center justify-center rounded-full border p-2 transition-colors"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
        <LocaleSwitcher />
        <MobileNav
          items={items}
          signInLabel={t("signIn")}
          menuLabel={t("menu")}
          closeLabel={t("close")}
        />
      </div>
    </HeaderShell>
  );
}
