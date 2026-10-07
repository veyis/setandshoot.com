import type { Metadata } from "next";
import { AuthUIProvider } from "@/components/auth/auth-ui-provider";

// Keep authentication and account pages out of search in every locale.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthUIProvider>{children}</AuthUIProvider>;
}
