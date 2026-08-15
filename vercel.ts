import { type VercelConfig, routes } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "bash scripts/deploy-migrate.sh && pnpm build",
  installCommand: "pnpm install --frozen-lockfile",
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
  ],
};
