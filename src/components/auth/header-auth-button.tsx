"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth/client";

type Props = { signInLabel: string; accountLabel: string };

/**
 * Header account button. Signed out (or while the session is loading) it links
 * to /sign-in with the outline user icon; signed in it links to /account and
 * shows the user's initial so the state is visible at a glance.
 */
export function HeaderAuthButton({ signInLabel, accountLabel }: Props) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  if (user) {
    const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
    return (
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/account" as any}
        aria-label={accountLabel}
        title={accountLabel}
        className="border-ink bg-ink text-canvas hover:bg-accent hover:border-accent inline-flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs transition-colors"
      >
        {initial}
      </Link>
    );
  }

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={"/sign-in" as any}
      aria-label={signInLabel}
      title={signInLabel}
      className="border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex items-center justify-center rounded-full border p-2 transition-colors"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Link>
  );
}
