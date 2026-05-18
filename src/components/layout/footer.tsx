import Link from "next/link";
import { getTranslations } from "next-intl/server";

type FooterLink = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  href: any;
  label: string;
};

export async function Footer() {
  const t = await getTranslations("footer");

  const links: FooterLink[] = [
    { href: "/impressum", label: t("impressum") },
    { href: "/datenschutz", label: t("datenschutz") },
    { href: "/bildrechte", label: t("bildrechte") },
  ];

  return (
    <footer className="border-hairline text-ink-muted mt-24 border-t px-6 py-8 text-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Belin Akguel</p>
        <nav className="flex gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
