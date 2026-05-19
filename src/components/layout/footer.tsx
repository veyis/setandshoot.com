import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getUTCFullYear();

  const nav = [
    { href: "/stories", label: t("nav.stories") },
    { href: "/highlights", label: t("nav.highlights") },
    { href: "/athletes", label: t("nav.athletes") },
    { href: "/about", label: t("nav.about") },
    { href: "/services", label: t("nav.services") },
    { href: "/journal", label: t("nav.journal") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const legal = [
    { href: "/impressum", label: t("footer.impressum") },
    { href: "/datenschutz", label: t("footer.datenschutz") },
    { href: "/bildrechte", label: t("footer.bildrechte") },
  ];

  return (
    <footer className="footer border-hairline border-t px-6 pt-16 pb-10 md:px-12">
      {/* Row 1 — wordmark band */}
      <div className="border-hairline border-b pb-12">
        <p className="font-display text-[clamp(3rem,10vw,8rem)] leading-[0.95] tracking-tight">
          set &amp; shoot
        </p>
      </div>

      {/* Row 2 — 3 columns */}
      <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <p className="text-ink-faint mb-2 font-mono text-[10px] tracking-[0.2em] uppercase">
            NAVIGATION
          </p>
          {nav.map((item) => (
            <Link
              key={item.href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={item.href as any}
              className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-ink-faint mb-2 font-mono text-[10px] tracking-[0.2em] uppercase">
            LEGAL
          </p>
          {legal.map((item) => (
            <Link
              key={item.href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={item.href as any}
              className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-ink-faint mb-2 font-mono text-[10px] tracking-[0.2em] uppercase">
            CONNECT
          </p>
          <a
            href="https://www.instagram.com/belin.akguel/"
            className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            href="mailto:hallo@setandshoot.com"
            className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
          >
            Email
          </a>
        </div>
      </div>

      {/* Row 3 — micro-credits */}
      <div className="border-hairline text-ink-faint border-t pt-6 font-mono text-[10px] tracking-[0.15em] uppercase">
        © BELIN AKGUEL {year} · GESCHALTET IN BREMEN · ENGINEERED WITH RESTRAINT
      </div>
    </footer>
  );
}
