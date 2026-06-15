# Operational Hardening: migrate-on-deploy, env validation, repo guardrails

**Date:** 2026-06-15
**Status:** Approved design — pending spec review
**Scope decision:** migrate-on-deploy + env all-or-none validation + guardrails. **Excluded by user decision:** server-side Sentry capture, CSP header.

## Context

The Growth & Go-Live SEO phase is shipped and live (PRs #7, #8). A production audit flagged operational gaps; the highest-value one was proven live last session — the **manual, no-migrate-on-deploy** process caused an extended migration saga and risks silently 500ing prod when a future schema change ships without the manual `payload migrate` step. This phase removes that foot-gun and tightens config + repo guardrails.

Key infra facts (carried from last session): there is **one Neon database** — `.env.local` uses the direct endpoint, Vercel uses the `-pooler` endpoint (same DB). Prod migrations are currently manual (`vercel.ts` buildCommand is just `pnpm build`). Payload's CLI prompts "dev mode push detected … data loss will occur, proceed?" against this DB because it has been push-modified — so any non-interactive migrate must auto-confirm.

## Goals

1. Production schema migrations apply **automatically** on deploy — no manual step, no foot-gun.
2. Required-together env vars (`R2_*`, `RESEND_API_KEY`) **fail fast** on partial config instead of silently degrading.
3. Repo guardrails: `main` is protected, code ownership is defined, and rolling back a bad deploy is documented.

## Non-Goals

- Server-side Sentry capture in actions/API (excluded by decision this phase).
- Content-Security-Policy header (deferred).
- Product-surface work (presigned uploads, `/account/bookings`, etc.).

## Design

### 1. Migrate-on-deploy (`vercel.ts`)

`vercel.ts` is TypeScript, so gate the build command on `process.env.VERCEL_ENV`:

- **Production** deploys: `buildCommand = "pnpm payload:migrate:force && pnpm build"`.
- **Preview / development** deploys: `buildCommand = "pnpm build"` (unchanged) — preview deploys must NOT auto-apply unmerged/experimental migrations to the shared DB.

Details:

- `pnpm payload:migrate:force` = `PAYLOAD_MIGRATE_FORCE=1 bash scripts/payload-cli.sh migrate`, which pipes `y\n` into `payload migrate` (non-interactive). On Vercel the script's `[[ -f .env.local ]]` guard is false (no `.env.local` in the build), so it uses Vercel's build env vars (`DATABASE_URL` etc. are present — the build already reaches the DB for `generateStaticParams`).
- The auto-`y` confirms Payload's generic "dev-push detected, data loss will occur" prompt. Our pending/future migrations are **additive** (ADD COLUMN / CREATE TABLE), so no actual data loss; the prompt is a generic warning, not migration-specific. (Hygiene note for the runbook: don't run dev-mode `push` against the shared prod DB going forward.)
- Migrate runs at **build time**, before the new code goes live. Additive migrations applied before the new code deploys are safe (the currently-live old code ignores the new columns during the brief window). If migrate **fails**, the build fails and the deploy does not ship — prod stays on the last good deploy (fail-safe).

### 2. Env all-or-none validation (`src/env.ts`)

`src/env.ts` currently validates the core vars (DATABASE*URL, PAYLOAD_SECRET, NEXT_PUBLIC_SITE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET, optional SENTRY) but NOT `R2*\*`or`RESEND_API_KEY`, so a partial R2 config silently falls back to local-disk storage and a missing RESEND key silently disables email.

Add to the schema (all optional, empty-string→undefined like the existing `optionalUrl`):
`R2_BUCKET`, `R2_ENDPOINT` (url), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE_URL` (url), `RESEND_API_KEY`.

Add a `.superRefine` (or `.refine`): the five `R2_*` vars must be **all set or all unset** — if 1–4 are present, throw a clear error naming the missing ones. `RESEND_API_KEY` stays independently optional (validated as a non-empty string if present). This refine is pure and unit-testable.

### 3. Repo guardrails

- **`.github/CODEOWNERS`** — assign the repo to the owner (e.g. `* @veyis`) so PRs request review automatically.
- **Branch protection on `main`** — require the CI workflow status checks to pass and ≥1 approving review before merge; this is a GitHub setting applied via `gh api` (exact call in the plan) or the GitHub UI. Documented either way.
- **`docs/runbooks/rollback.md`** — how to roll back a bad production deploy: (a) Vercel — promote the previous Ready deployment (or `vercel rollback`); (b) revert the merge commit on `main` (re-deploys old code); (c) migration rollback — `payload migrate:down` reverts the last batch (note: down() drops the added columns/tables; only do this if a migration is the cause). Include the single-Neon-DB / pooler-vs-direct note and the broken-IPv6 `--dns-result-order=ipv4first` gotcha.

## Testing

- **Unit:** the env all-or-none refine — `tests/unit/env.test.ts` (or a new file): 0 R2 vars → ok; all 5 → ok; partial (e.g. 2 of 5) → throws naming the missing ones; RESEND present/absent both ok.
- **Migrate-on-deploy:** verified by the next production deploy's build log showing `payload migrate` ran (and a preview deploy showing it did NOT). No new automated test — it's a build-config change.
- **Guardrails:** CODEOWNERS + runbook are files (presence + content review); branch protection verified via `gh api repos/{owner}/{repo}/branches/main/protection` read-back.

## Build Order

1. Env all-or-none validation + unit test (isolated, safe, no deploy impact).
2. `vercel.ts` migrate-on-deploy (the headline) — verified on the next prod deploy.
3. `.github/CODEOWNERS` + `docs/runbooks/rollback.md`.
4. Branch protection on `main` (gh api / GitHub UI — may require the user's GitHub permissions).

## Success Criteria

- A production deploy runs `payload migrate` automatically (build log evidence); a preview deploy does not.
- Partial `R2_*` config fails `env.ts` at startup with a clear message; full or empty config passes.
- `main` requires CI + review to merge; CODEOWNERS present; `rollback.md` documents the three rollback paths.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` green; no change to the running site's behavior (this phase is deploy/config/repo only).

## Risks & Mitigations

- **Auto-confirming the "data loss" prompt on prod.** Mitigated: our migrations are additive; the prompt is Payload's generic dev-push warning, not migration-specific. The runbook adds "don't push against prod" guidance to stop the prompt's root cause over time.
- **Build-time migrate against the live DB.** Additive + idempotent; failure fails the build (no broken deploy). Gated to production so preview deploys don't touch it.
- **Branch protection may need elevated GitHub permissions.** If `gh api` can't set it, the plan falls back to documented manual UI steps.
