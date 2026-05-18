"use client";

import type { ReactNode } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

export function AuthUIProvider({ children }: { children: ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient} defaultTheme="system">
      {children}
    </NeonAuthUIProvider>
  );
}
