/**
 * Only allow same-origin, non-protocol-relative paths as post-auth redirect
 * targets. Anything else (absolute URLs, `//evil.com`) falls back to the
 * account page, closing the open-redirect / phishing vector on `?next=`.
 */
export function safeRedirectPath(next: string | undefined, fallback = "/account"): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}
