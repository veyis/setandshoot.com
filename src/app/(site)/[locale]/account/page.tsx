import { AccountViewClient } from "@/components/auth/account-view-client";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  await requireUser("/account");
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <AccountViewClient />
    </main>
  );
}
