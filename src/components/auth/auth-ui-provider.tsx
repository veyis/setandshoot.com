"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthUIProvider as BetterAuthUIProvider } from "@neondatabase/auth-ui";
import { Toaster } from "sonner";
import { authClient } from "@/lib/auth/client";

/**
 * Auth UI without NeonAuthUIProvider's next-themes wrapper (its inline script triggers
 * React 19 console errors). The site is dark-only (`className="dark"` on html).
 */
export function AuthUIProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <div className="neon-auth-ui">
      <BetterAuthUIProvider
        authClient={authClient as never}
        navigate={(href) => router.push(href as never)}
        replace={(href) => router.replace(href as never)}
        onSessionChange={() => router.refresh()}
        Link={Link as never}
        multiSession={false}
        apiKey={false}
        magicLink={false}
        passkey={false}
        oneTap={false}
        // Google OAuth. The button proxies through /api/auth/sign-in/social to the
        // Neon Auth server, which holds the Google client ID/secret (configured in
        // the Neon console). `redirectTo` on each AuthView becomes the post-login
        // callback, so the existing ?next= flow is preserved.
        social={{ providers: ["google"] }}
      >
        {children}
        <Toaster richColors theme="dark" />
      </BetterAuthUIProvider>
    </div>
  );
}
