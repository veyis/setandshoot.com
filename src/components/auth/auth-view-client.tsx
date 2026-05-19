"use client";

import { AuthView } from "@neondatabase/auth-ui";

export type AuthPageView = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

const AUTH_VIEWS = {
  "sign-in": "SIGN_IN",
  "sign-up": "SIGN_UP",
  "forgot-password": "FORGOT_PASSWORD",
  "reset-password": "RESET_PASSWORD",
} as const;

type Props = { view: AuthPageView; nextPath?: string };

export function AuthViewClient({ view, nextPath }: Props) {
  return <AuthView view={AUTH_VIEWS[view]} redirectTo={nextPath ?? "/account"} />;
}
