import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { locales } from "@/lib/i18n/config";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin-emails";
import { promoteNeonAdminByEmail } from "@/lib/auth/promote-neon-admin";

const handleI18nRouting = createIntlMiddleware(routing);

/** Neon Auth / better-auth-ui default paths → our locale routes (no /auth prefix). */
const AUTH_PAGE_REDIRECTS: Record<string, string> = {
  "/auth/sign-in": "/sign-in",
  "/auth/sign-up": "/sign-up",
  "/auth/forgot-password": "/forgot-password",
  "/auth/reset-password": "/reset-password",
  "/auth/magic-link": "/sign-in",
  "/auth/email-otp": "/sign-in",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Neon Auth defaults to /auth/*; our UI lives at /sign-in and /sign-up.
  // Must run before intl — otherwise /auth/sign-up becomes /de/auth/sign-up (404).
  const authPageRedirect = AUTH_PAGE_REDIRECTS[pathname];
  if (authPageRedirect) {
    const url = request.nextUrl.clone();
    url.pathname = authPageRedirect;
    return NextResponse.redirect(url);
  }

  // /api/* (other than /api/auth, which the matcher already excludes) must
  // bypass intl rewriting — locale prefixes would turn /api/health into
  // /de/api/health and 404.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  // Gate /admin and /studio: Neon Auth is the only login. Payload admin trusts
  // the same session via the `neon` custom auth strategy (no separate CMS
  // password). /studio pages live inside the [locale] tree, so after the gate
  // they must continue through intl routing instead of NextResponse.next.
  const isAdminPath = pathname.startsWith("/admin");
  const isStudioPath =
    pathname === "/studio" ||
    pathname.startsWith("/studio/") ||
    locales.some(
      (locale) => pathname === `/${locale}/studio` || pathname.startsWith(`/${locale}/studio/`),
    );

  if (isAdminPath || isStudioPath) {
    let { data: session } = await auth.getSession();
    if (!session?.user) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (session.user.role !== "admin" && isAdminEmail(session.user.email)) {
      await promoteNeonAdminByEmail(session.user.email);
      ({ data: session } = await auth.getSession());
    }

    if (session?.user?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      url.searchParams.set("error", "admin_required");
      return NextResponse.redirect(url);
    }

    if (isAdminPath) {
      // Native Payload login is disabled (Neon-only auth), so the legacy
      // /admin/login route can only render an empty Payload splash. Funnel it
      // back through the gate → dashboard if signed in, → /sign-in if not.
      if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next({ request });
    }

    return handleI18nRouting(request);
  }

  return handleI18nRouting(request);
}

export const config = {
  // Exclude `opengraph-image`, `icon` and `apple-icon` metadata routes (next/og) — they have no file
  // extension, so the `.*\\..*` clause doesn't catch them, and intl rewriting
  // would 404 the root card and add a redirect hop to the per-locale cards.
  matcher: ["/((?!api/auth|_next|_vercel|icon$|apple-icon$|.*opengraph-image.*|.*\\..*).*)"],
};
