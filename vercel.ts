import { type VercelConfig, routes } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "bash scripts/deploy-migrate.sh && pnpm build",
  installCommand: "pnpm install --frozen-lockfile",
  // Skip builds for docs-only pushes. This used to live in a vercel.json next
  // to this file, which Vercel rejects outright ("Multiple configuration files
  // found") — every deploy from 2026-08-27 to 08-31 failed on it. One config.
  ignoreCommand:
    "git rev-parse --verify HEAD^ >/dev/null 2>&1 || exit 1; git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md' ':(exclude)docs/**' ':(exclude).github/**'",
  regions: ["fra1"],
  headers: [
    routes.cacheControl("/_next/static/(.*)", {
      public: true,
      maxAge: "1 year",
      immutable: true,
    }),
  ],
  redirects: [
    {
      source: "/portal",
      destination: "https://pxlpeak.com/portal",
      permanent: false,
    },
    {
      source: "/portal/:path*",
      destination: "https://pxlpeak.com/portal/:path*",
      permanent: false,
    },
    {
      source: "/admin/",
      destination: "/admin",
      permanent: true,
    },
    {
      source: "/auth/sign-in",
      destination: "/sign-in",
      permanent: false,
    },
    {
      source: "/auth/sign-up",
      destination: "/sign-up",
      permanent: false,
    },
    {
      source: "/gallery",
      destination: "/stories",
      permanent: true,
    },
    {
      source: "/photo/:id",
      destination: "/stories",
      permanent: true,
    },
  ],
};
