# belin akguel — volleyball photography

Production website + admin for Belin Akguel, Bremen-based volleyball photographer.

## Stack

- Next.js 16 (App Router, React 19, Turbopack)
- Payload v3 (embedded at `/admin`) — Postgres via `@payloadcms/db-postgres`, photo storage via `@payloadcms/storage-vercel-blob`
- Tailwind v4, `next-intl` (DE default + EN)
- Vercel Analytics + Speed Insights (cookieless), Sentry (no PII)
- Hosted on Vercel Fluid Compute, Frankfurt region

## Prerequisites

- Node ≥ 24 (see `.nvmrc`)
- pnpm 11.1.1
- A Neon Postgres database (EU region)
- A Vercel Blob store (EU region)

## Setup

```bash
pnpm install
vercel link              # one-time, links the project
vercel env pull .env.local
pnpm exec lefthook install
```

## Run

```bash
pnpm dev
```

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin

First-run: open `/admin`, create the initial admin user, then set its role to `admin` in the user record.

## Common commands

| Command                       | What it does                                       |
| ----------------------------- | -------------------------------------------------- |
| `pnpm dev`                    | Next.js + Payload dev server                       |
| `pnpm build`                  | Production build                                   |
| `pnpm typecheck`              | TypeScript strict check                            |
| `pnpm lint`                   | ESLint                                             |
| `pnpm test`                   | Vitest unit tests                                  |
| `pnpm test:e2e`               | Playwright end-to-end tests                        |
| `pnpm payload:generate-types` | Regenerate `payload-types.ts` after schema changes |

## Deployment

Pushes to `main` deploy to production automatically via Vercel.
PRs get a preview URL with an isolated Neon branch.

## Specs and plans

See `docs/superpowers/specs/` and `docs/superpowers/plans/`.

# setandshoot.com
