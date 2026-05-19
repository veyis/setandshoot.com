import { AuthUIProvider } from "@/components/auth/auth-ui-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthUIProvider>{children}</AuthUIProvider>;
}
