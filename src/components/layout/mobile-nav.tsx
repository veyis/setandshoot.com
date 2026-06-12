"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { authClient } from "@/lib/auth/client";

const DRAWER_ID = "mobile-nav-drawer";

type Item = { href: string; label: string };

type Props = {
  items: Item[];
  signInLabel: string;
  accountLabel: string;
  menuLabel: string;
  closeLabel: string;
};

export function MobileNav({ items, signInLabel, accountLabel, menuLabel, closeLabel }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { data: session } = authClient.useSession();
  const signedIn = Boolean(session?.user);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // While open: close on Escape, trap focus inside the drawer, and lock
  // background scroll. The drawer only renders after a client click, so
  // document is always available here.
  useEffect(() => {
    if (!open) return;

    const drawer = drawerRef.current;
    const trigger = triggerRef.current;
    // Move focus into the drawer (first focusable element).
    drawer?.querySelector<HTMLElement>("button, a[href]")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawer) return;
      const focusables = drawer.querySelectorAll<HTMLElement>("button, a[href]");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      // Restore focus to the trigger when the drawer closes.
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        aria-controls={DRAWER_ID}
        className="border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex items-center justify-center rounded-full border p-2 transition-colors"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open
        ? createPortal(
            <div
              ref={drawerRef}
              id={DRAWER_ID}
              role="dialog"
              aria-modal="true"
              aria-label={menuLabel}
              className="bg-canvas fixed inset-0 z-[60] flex flex-col px-6 py-4"
            >
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={close}
                  aria-label={closeLabel}
                  className="border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex items-center justify-center rounded-full border p-2 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </div>

              <nav className="mt-8 flex flex-col gap-6">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={item.href as any}
                    onClick={close}
                    className="font-display text-ink hover:text-accent text-3xl tracking-tight transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={(signedIn ? "/account" : "/sign-in") as any}
                onClick={close}
                className="border-hairline text-ink hover:bg-ink hover:text-canvas mt-auto inline-flex w-fit rounded-sm border px-5 py-2.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors"
              >
                {signedIn ? accountLabel : signInLabel}
              </Link>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
