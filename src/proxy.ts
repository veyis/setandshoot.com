import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const supabaseResponse = await updateSession(request);

  if (supabaseResponse.headers.get("location")) {
    return supabaseResponse;
  }

  const intlResponse = handleI18nRouting(request);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
