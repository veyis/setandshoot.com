"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";

type State = "idle" | "email" | "google" | "error";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

/**
 * shadcn `login-03`-style centered login card, rebuilt with the site's own
 * design tokens and wired to Neon Auth (better-auth client): email/password
 * sign-in + Google. Sign-up / forgot-password stay on their existing routes.
 */
export function LoginForm({ nextPath = "/account" }: { nextPath?: string }) {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = state === "email" || state === "google";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setState("email");
    setError(null);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    try {
      const { error: signInError } = await authClient.signIn.email({ email, password });
      if (signInError) {
        setState("error");
        setError(t("error"));
        return;
      }
      router.push(nextPath as Parameters<typeof router.push>[0]);
      router.refresh();
    } catch {
      setState("error");
      setError(t("error"));
    }
  }

  async function onGoogle() {
    if (busy) return;
    setState("google");
    setError(null);
    // Redirects to the Neon Auth → Google flow, returning to nextPath.
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: nextPath });
    } catch {
      setState("error");
      setError(t("error"));
    }
  }

  return (
    <div className="border-hairline bg-elevated rounded-sm border p-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-2xl">{t("title")}</h1>
        <p className="text-ink-muted text-sm">{t("subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="text-sm">
            {t("email")}
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            disabled={busy}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="text-sm">
              {t("password")}
            </label>
            <Link
              href="/forgot-password"
              className="text-ink-muted hover:text-ink text-xs underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            aria-required="true"
            autoComplete="current-password"
            disabled={busy}
            className={fieldClass}
          />
        </div>

        <p
          className="text-accent text-sm empty:sr-only"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {state === "error" ? error : ""}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="bg-accent text-canvas hover:bg-accent/90 w-full rounded-sm px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {state === "email" ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="border-hairline flex-1 border-t" />
        <span className="text-ink-muted text-xs tracking-wide uppercase">{t("orContinue")}</span>
        <span className="border-hairline flex-1 border-t" />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        className="border-hairline hover:bg-canvas flex w-full items-center justify-center gap-2 rounded-sm border px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
      >
        <GoogleIcon />
        {state === "google" ? t("submitting") : t("withGoogle")}
      </button>

      <p className="text-ink-muted mt-6 text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/sign-up" className="text-ink underline">
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
