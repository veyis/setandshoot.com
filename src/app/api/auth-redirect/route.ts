import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const nextParam = url.searchParams.get("next") || "/account";

  try {
    const { data: session } = await auth.getSession();

    if (session?.user?.role === "admin") {
      url.pathname = "/studio";
    } else {
      url.pathname = nextParam;
    }
  } catch {
    url.pathname = nextParam;
  }

  url.searchParams.delete("next");

  return NextResponse.redirect(url);
}
