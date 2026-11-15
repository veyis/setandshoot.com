# Agent instructions

## Deploying

Production deploys come only from Git. A push or merge to `main` triggers the
Vercel production build, and a pushed branch or pull request gets a preview.

- Do not run `vercel deploy`, `vercel --prod` or `vercel redeploy` unless the
  owner asks for that specific deploy. A CLI deploy is a second paid build of
  code that Git builds anyway, and it can publish uncommitted work that the
  next Git deploy silently overwrites. From 2026-10-21 to 2026-11-14, 199 CLI
  deploys helped push the Vercel team past its spend cap, which paused every
  site on 2026-11-14.
- Push related commits together. Every push to `main` is a full build.
- `scripts/vercel-ignore-build.sh` (the `ignoreCommand` in `vercel.ts`) skips
  the build when only root-level Markdown, root dot-directories, `docs/`,
  `analysis/`, `tmp/`, `outputs/` or test files changed. Markdown below the
  root, such as blog posts, still builds. The canonical copy is
  `tier1/pxlpeak.com/scripts/vercel-ignore-build.sh` in `~/Desktop/websites`:
  edit it there, then copy it to each site.
