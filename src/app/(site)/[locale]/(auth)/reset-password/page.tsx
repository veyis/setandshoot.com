import { AuthViewClient } from "@/components/auth/auth-view-client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-32 pb-16">
      <AuthViewClient view="reset-password" />
    </main>
  );
}
