import type { Route } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export async function requireUser(next = "/") {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect(`/sign-in?next=${encodeURIComponent(next)}` as Route);
  }
  return session.user;
}

export async function requireAdmin(next = "/") {
  const user = await requireUser(next);
  if (user.role !== "admin") {
    redirect("/" as Route);
  }
  return user;
}
