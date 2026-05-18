"use client";

import { AuthView } from "@neondatabase/auth-ui";

type Props = { view: "sign-in" | "sign-up"; nextPath?: string };

export function AuthViewClient({ view, nextPath }: Props) {
  return (
    <AuthView
      view={view === "sign-in" ? "SIGN_IN" : "SIGN_UP"}
      redirectTo={nextPath ?? "/account"}
    />
  );
}
