import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { auth } from "@/lib/auth/server";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/* (other than /api/auth, which the matcher already excludes) must
  // bypass intl rewriting — locale prefixes would turn /api/health into
  // /de/api/health and 404.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  // Gate /admin: must be signed in AND have admin role. Payload still owns
  // editor auth after this gate.
  if (pathname.startsWith("/admin")) {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.user.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api/auth|_next|_vercel|.*\\..*).*)"],
};
