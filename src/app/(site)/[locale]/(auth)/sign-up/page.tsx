import { AuthViewClient } from "@/components/auth/auth-view-client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 pt-32 pb-16">
      <AuthViewClient view="sign-up" nextPath={next} />
    </main>
  );
}
