import { AuthViewClient } from "@/components/auth/auth-view-client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      {error === "admin_required" ? (
        <p className="text-accent mb-6 text-sm">
          This account does not have CMS admin access yet. Sign in with an admin email, or sign up
          first at{" "}
          <a href="/sign-up" className="underline">
            /sign-up
          </a>
          .
        </p>
      ) : null}
      {next?.startsWith("/admin") ? (
        <p className="text-ink-muted mb-6 text-sm">
          One account for the site and the CMS — sign in once, then you go straight to{" "}
          <code className="text-xs">/admin</code>.
        </p>
      ) : null}
      <p className="text-ink-muted mb-6 text-sm">
        <a href="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </a>
      </p>
      <AuthViewClient view="sign-in" nextPath={next} />
    </main>
  );
}
