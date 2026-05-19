import { type VercelConfig, routes } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm build",
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
