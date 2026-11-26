import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const rawNext = url.searchParams.get("next") || "/account";
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
      ? rawNext
      : "/account";

  try {
    const { data: session } = await auth.getSession();

    if (session?.user?.role === "admin") {
      url.pathname = "/studio";
    } else {
      url.pathname = safeNext;
    }
  } catch {
    url.pathname = safeNext;
  }

  url.searchParams.delete("next");

  return NextResponse.redirect(url);
}
