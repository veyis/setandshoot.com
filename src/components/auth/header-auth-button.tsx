"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type Props = {
  signInLabel: string;
  accountLabel: string;
  adminLabel?: string;
  logOutLabel?: string;
};

/**
 * Header account button. Signed out (or while the session is loading) it links
 * to /sign-in with the outline user icon; signed in it shows a dropdown with
 * account options.
 */
export function HeaderAuthButton({
  signInLabel,
  accountLabel,
  adminLabel = "Admin",
  logOutLabel = "Log out",
}: Props) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleSignOut() {
    setIsOpen(false);
    await authClient.signOut();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push("/" as any);
    router.refresh();
  }

  if (user) {
    const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={accountLabel}
          title={accountLabel}
          className="border-ink bg-ink text-canvas hover:bg-accent hover:border-accent inline-flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs transition-colors"
        >
          {initial}
        </button>
        {isOpen && (
          <div className="border-hairline bg-canvas absolute top-full right-0 z-50 mt-2 flex w-48 flex-col rounded-sm border p-1 shadow-sm">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={"/account" as any}
              onClick={() => setIsOpen(false)}
              className="text-ink hover:bg-elevated rounded-sm px-3 py-2 text-sm transition-colors"
            >
              {accountLabel}
            </Link>
            {user.role === "admin" && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={"/studio" as any}
                onClick={() => setIsOpen(false)}
                className="text-ink hover:bg-elevated rounded-sm px-3 py-2 text-sm transition-colors"
              >
                {adminLabel}
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="text-ink hover:bg-elevated border-hairline mt-1 rounded-sm border-t px-3 py-2 pt-2 text-left text-sm transition-colors"
            >
              {logOutLabel}
            </button>
          </div>
        )}
      </div>
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
