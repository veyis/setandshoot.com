import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { auth } from "@/lib/auth/server";

const handleI18nRouting = createIntlMiddleware(routing);
const authMiddleware = auth.middleware();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Refresh Neon Auth session cookie.
  const authResponse = await authMiddleware(request);

  // 2. Gate /admin: must be signed in AND have admin role.
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
    return authResponse ?? NextResponse.next({ request });
  }

  // 3. Apply intl routing for everything else.
  const intlResponse = handleI18nRouting(request);

  // 4. Forward any auth cookies set by step 1 onto the intl response.
  if (authResponse) {
    authResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api/auth|_next|_vercel|.*\\..*).*)"],
};
