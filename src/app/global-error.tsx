"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas text-ink min-h-screen flex items-center justify-center p-6 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6">
          <p className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
            Belin Akguel
          </p>
          <h1 className="font-display text-3xl tracking-tight">Something went wrong</h1>
          <p className="text-ink-muted text-sm leading-relaxed">
            An unexpected error interrupted this page. Try again, or return home.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-accent text-canvas px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase cursor-pointer"
            >
              Try again
            </button>
            <a
              href="/"
              className="border-hairline border px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase text-ink"
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
