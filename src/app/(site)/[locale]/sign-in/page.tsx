import { AuthViewClient } from "@/components/auth/auth-view-client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <AuthViewClient view="sign-in" nextPath={next} />
    </main>
  );
}
