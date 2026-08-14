import Link from "next/link";

/** Rendered above the Payload admin nav groups — the only way back to the site. */
export function BackToSite() {
  return (
    <Link
      href={"/" as any}
      className="nav__link"
      style={{ display: "block", padding: "4px 0", marginBottom: "12px" }}
    >
      ← Back to site
    </Link>
  );
}
