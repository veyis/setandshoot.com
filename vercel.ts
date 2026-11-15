import { type VercelConfig, routes } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "bash scripts/deploy-migrate.sh && pnpm build",
  installCommand: "pnpm install --frozen-lockfile",
  // Skips builds when only notes, docs, tests or agent config changed; see
  // scripts/vercel-ignore-build.sh. This used to live in a vercel.json next
  // to this file, which Vercel rejects outright ("Multiple configuration files
  // found") — every deploy from 2026-08-27 to 08-31 failed on it. One config.
  ignoreCommand: "bash scripts/vercel-ignore-build.sh",
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
