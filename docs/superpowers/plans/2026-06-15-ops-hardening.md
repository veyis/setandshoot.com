# Operational Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make production schema migrations run automatically on deploy, fail-fast on partial `R2_*`/`RESEND` env config, and add repo guardrails (CODEOWNERS, branch protection, rollback runbook).

**Architecture:** Migrate-on-deploy via a `VERCEL_ENV`-gated wrapper script invoked from `vercel.ts`'s build command (production only). Env validation via a side-effect-free `src/env-schema.ts` (extracted from `src/env.ts`) carrying an all-or-none `R2_*` refine, imported by both `env.ts` and the unit test. Guardrails are config/docs files plus a `gh api` branch-protection call.

**Tech Stack:** Next.js 16, Payload 3.84, Zod v4, Vitest, `@vercel/config` (vercel.ts), bash, `gh` CLI.

**Spec:** `docs/superpowers/specs/2026-06-15-ops-hardening-design.md`

**Repo conventions (read before starting):**

- Pre-commit hook (lefthook) runs `prettier --check` + `tsc`. Run `pnpm exec prettier --write <files>` before every commit or it's rejected.
- `@/` path alias → `src/`. Run one test file: `pnpm test -- <path>`.
- This machine has broken IPv6 — prefix DB CLI commands with `NODE_OPTIONS=--dns-result-order=ipv4first` (not needed for the tasks below, which don't hit the DB).
- Do NOT push or merge without explicit user approval. Work on branch `feat/ops-hardening`.

---

## File Structure

**Create:**

- `src/env-schema.ts` — side-effect-free Zod schema (the env contract) + `Env` type. No `process.env` access, no throw. Importable by tests.
- `scripts/deploy-migrate.sh` — runs `payload migrate` only when `VERCEL_ENV=production`; otherwise skips. Invoked by the Vercel build command.
- `.github/CODEOWNERS` — default code ownership.
- `docs/runbooks/rollback.md` — production rollback procedure.

**Modify:**

- `src/env.ts` — import the schema from `src/env-schema.ts`; keep the parse-`process.env`-and-throw behavior + `env`/`Env` exports.
- `tests/unit/env.test.ts` — import the schema from `@/env-schema` (drop the duplicated inline copy); add R2 all-or-none + RESEND tests.
- `vercel.ts` — build command runs `scripts/deploy-migrate.sh` before `next build`.

---

## Task 1: Extract env schema + add R2/RESEND all-or-none validation

**Files:**

- Create: `src/env-schema.ts`
- Modify: `src/env.ts`, `tests/unit/env.test.ts`

- [ ] **Step 1: Create `src/env-schema.ts`** (side-effect-free — exports the schema only):

```ts
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalStr = z.preprocess(emptyToUndefined, z.string().min(1).optional());

/** Cloudflare R2 storage vars — must be all set or all unset. */
const R2_KEYS = [
  "R2_BUCKET",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BASE_URL",
] as const;

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be ≥ 32 chars"),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEON_AUTH_BASE_URL: z.string().url(),
    NEON_AUTH_COOKIE_SECRET: z.string().min(32, "NEON_AUTH_COOKIE_SECRET must be ≥ 32 chars"),
    SENTRY_DSN: optionalUrl,
    NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
    R2_BUCKET: optionalStr,
    R2_ENDPOINT: optionalUrl,
    R2_ACCESS_KEY_ID: optionalStr,
    R2_SECRET_ACCESS_KEY: optionalStr,
    R2_PUBLIC_BASE_URL: optionalUrl,
    RESEND_API_KEY: optionalStr,
  })
  .superRefine((data, ctx) => {
    const isSet = (k: (typeof R2_KEYS)[number]) => {
      const v = (data as Record<string, unknown>)[k];
      return v != null && v !== "";
    };
    const present = R2_KEYS.filter(isSet);
    if (present.length !== 0 && present.length !== R2_KEYS.length) {
      const missing = R2_KEYS.filter((k) => !isSet(k));
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [missing[0]!],
        message: `R2 storage is partially configured (${present.length}/${R2_KEYS.length}). Set all of ${R2_KEYS.join(", ")} or none. Missing: ${missing.join(", ")}.`,
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
```

- [ ] **Step 2: Rewrite the test to import the real schema + add the new cases.** Replace the entire contents of `tests/unit/env.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { envSchema } from "@/env-schema";

const validBase = {
  DATABASE_URL: "postgres://u:p@h/d",
  PAYLOAD_SECRET: "x".repeat(32),
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEON_AUTH_BASE_URL: "https://ep-xxx.neonauth.eu-central-1.aws.neon.tech/neondb/auth",
  NEON_AUTH_COOKIE_SECRET: "y".repeat(32),
};

const allR2 = {
  R2_BUCKET: "bucket",
  R2_ENDPOINT: "https://endpoint.example.com",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_PUBLIC_BASE_URL: "https://cdn.example.com",
};

describe("env schema", () => {
  it("accepts a valid configuration", () => {
    expect(envSchema.parse(validBase)).toMatchObject({ NODE_ENV: "development" });
  });

  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL: _drop, ...rest } = validBase;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it("rejects a short payload secret", () => {
    expect(() => envSchema.parse({ ...validBase, PAYLOAD_SECRET: "tooshort" })).toThrow();
  });

  it("rejects a short Neon Auth cookie secret", () => {
    expect(() => envSchema.parse({ ...validBase, NEON_AUTH_COOKIE_SECRET: "short" })).toThrow();
  });

  it("rejects a non-URL site URL", () => {
    expect(() => envSchema.parse({ ...validBase, NEXT_PUBLIC_SITE_URL: "not-a-url" })).toThrow();
  });

  it("accepts no R2 vars (all unset)", () => {
    expect(() => envSchema.parse(validBase)).not.toThrow();
  });

  it("accepts all 5 R2 vars set", () => {
    expect(() => envSchema.parse({ ...validBase, ...allR2 })).not.toThrow();
  });

  it("rejects partial R2 config and names the missing vars", () => {
    const result = envSchema.safeParse({
      ...validBase,
      R2_BUCKET: "bucket",
      R2_ENDPOINT: "https://endpoint.example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toMatch(/R2_ACCESS_KEY_ID/);
    }
  });

  it("accepts RESEND_API_KEY on its own", () => {
    expect(() => envSchema.parse({ ...validBase, RESEND_API_KEY: "re_test" })).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the test — expect FAIL** (module `@/env-schema` doesn't exist yet if you wrote the test first; if you created env-schema.ts in Step 1, this run should already pass — either order is fine, but confirm the new R2 cases drive the refine).

Run: `pnpm test -- tests/unit/env.test.ts`
Expected after Step 1+2: PASS (9 tests).

- [ ] **Step 4: Refactor `src/env.ts` to consume the extracted schema.** Replace its contents with:

```ts
import { envSchema, type Env } from "@/env-schema";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type { Env };
```

- [ ] **Step 5: Verify the whole suite + typecheck.**

Run: `pnpm test` → expect all green (was 152; now 152 with the env file’s net new cases — count may differ slightly, just ensure 0 failures).
Run: `pnpm typecheck` → PASS. (Confirms every `import { env } from "@/env"` and `type Env` consumer still resolves.)

- [ ] **Step 6: Commit.**

```bash
pnpm exec prettier --write src/env-schema.ts src/env.ts tests/unit/env.test.ts
git add src/env-schema.ts src/env.ts tests/unit/env.test.ts
git commit -m "feat(env): all-or-none R2 + RESEND validation; extract env-schema for testability"
```

---

## Task 2: Migrate-on-deploy (production-gated)

**Files:**

- Create: `scripts/deploy-migrate.sh`
- Modify: `vercel.ts`

- [ ] **Step 1: Create `scripts/deploy-migrate.sh`:**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Run Payload migrations only on PRODUCTION Vercel deploys. Preview/dev deploys
# skip (so unmerged/experimental migrations never auto-apply to the shared DB).
# PAYLOAD_MIGRATE_FORCE=1 makes payload-cli.sh auto-confirm Payload's
# "dev-push detected" prompt (our migrations are additive — no real data loss).
if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "[deploy-migrate] VERCEL_ENV=production → applying migrations"
  PAYLOAD_MIGRATE_FORCE=1 bash scripts/payload-cli.sh migrate
else
  echo "[deploy-migrate] VERCEL_ENV=${VERCEL_ENV:-unset} → skipping migrations"
fi
```

- [ ] **Step 2: Make it executable.**

Run: `chmod +x scripts/deploy-migrate.sh`

- [ ] **Step 3: Verify the SKIP path locally (safe — no DB access).**

Run: `VERCEL_ENV=preview bash scripts/deploy-migrate.sh`
Expected: prints `[deploy-migrate] VERCEL_ENV=preview → skipping migrations`, exit 0.
Run: `bash scripts/deploy-migrate.sh`
Expected: prints `… VERCEL_ENV=unset → skipping migrations`, exit 0.
(Do NOT run the production path locally — it would hit the DB. It's verified on the real deploy.)

- [ ] **Step 4: Wire it into `vercel.ts`.** The current `buildCommand` is `"pnpm build"`. Change ONLY that line to:

```ts
  buildCommand: "bash scripts/deploy-migrate.sh && pnpm build",
```

Leave `framework`, `installCommand`, `regions`, `headers`, `redirects` unchanged.

- [ ] **Step 5: Typecheck (vercel.ts is TS).**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
pnpm exec prettier --write vercel.ts scripts/deploy-migrate.sh
git add vercel.ts scripts/deploy-migrate.sh
git commit -m "feat(deploy): run payload migrate on production deploys (VERCEL_ENV-gated)"
```

---

## Task 3: Guardrails — CODEOWNERS + rollback runbook

**Files:**

- Create: `.github/CODEOWNERS`, `docs/runbooks/rollback.md`

- [ ] **Step 1: Create `.github/CODEOWNERS`:**

```
# Default owner for everything — PRs auto-request review from @veyis.
* @veyis
```

- [ ] **Step 2: Create `docs/runbooks/rollback.md`:**

````markdown
# Production Rollback Runbook

Prod = Vercel project `belinakguel-web` (team `veyis-projects`), auto-deploys from `main`.
One Neon DB: `.env.local` uses the **direct** endpoint, Vercel uses the **`-pooler`**
endpoint — same database. This machine has broken IPv6; prefix any DB CLI with
`NODE_OPTIONS=--dns-result-order=ipv4first`.

## 1. Bad deploy, no schema change → roll back the deployment

Fastest. Re-promote the previous good deployment:

```bash
vercel ls belinakguel-web --prod          # find the last Ready deployment before the bad one
vercel rollback <previous-deployment-url>  # or use the Vercel dashboard → Deployments → Promote
```

## 2. Bad code merged to main → revert the commit

Triggers a fresh deploy of the prior code:

```bash
git revert -m 1 <merge-commit-sha>   # -m 1 for a PR merge commit
git push origin main
```

## 3. A migration is the cause → roll the migration back

Only if a schema migration broke prod. `migrate:down` reverts the **last batch**.
Get the prod connection string from the **Neon dashboard** (Vercel won't surface it):

```bash
DATABASE_URL='<prod url from Neon>' \
PAYLOAD_SECRET='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
NEON_AUTH_COOKIE_SECRET='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
NEON_AUTH_BASE_URL='https://placeholder.invalid' \
NEXT_PUBLIC_SITE_URL='https://www.setandshoot.com' \
NODE_OPTIONS='--dns-result-order=ipv4first' \
PAYLOAD_CONFIG_PATH=src/payload/payload.config.ts \
pnpm exec payload migrate:down
```

The dummies satisfy `env.ts`; a migration only touches Postgres. `migrate:down`'s
`down()` drops the columns/tables the migration added — make sure that's what you want.

## Notes

- Migrations now run automatically on production deploys (`scripts/deploy-migrate.sh`,
  `VERCEL_ENV=production`). Do **not** run Payload dev-mode `push` against the shared
  prod DB — it leaves the "data-loss" prompt state the deploy script has to auto-confirm.
- Rotate the Neon DB password if a connection string was ever shared
  (see `rotate-exposed-secrets.md`).
````

- [ ] **Step 3: Commit.**

```bash
pnpm exec prettier --write .github/CODEOWNERS docs/runbooks/rollback.md
git add .github/CODEOWNERS docs/runbooks/rollback.md
git commit -m "docs(ops): add CODEOWNERS and production rollback runbook"
```

(Prettier may not format `CODEOWNERS` (no parser) — that's fine; `git add` it regardless.)

---

## Task 4: Branch protection on `main`

**Files:** none (GitHub setting via `gh api`). Requires admin on the repo.

- [ ] **Step 1: Apply branch protection.** Requires CI checks to pass and a PR (no direct pushes) before merging to `main`. Solo-friendly: 0 required approvals (bump to 1 when there are other maintainers).

```bash
gh api --method PUT repos/veyis/setandshoot.com/branches/main/protection \
  -H "Accept: application/vnd.github+json" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "typecheck"},
      {"context": "lint"},
      {"context": "unit"},
      {"context": "e2e"}
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
JSON
```

Expected: a JSON response describing the protection. If it returns `403`/`404`, the
token lacks admin — STOP and report; the user applies it in the GitHub UI instead
(Settings → Branches → Add rule for `main`: require status checks `typecheck`/`lint`/
`unit`/`e2e`, require a PR before merging).

- [ ] **Step 2: Verify.**

```bash
gh api repos/veyis/setandshoot.com/branches/main/protection \
  -q '.required_status_checks.checks[].context'
```

Expected: `typecheck`, `lint`, `unit`, `e2e`.

- [ ] **Step 3: No commit** (this task changes no files). Note the outcome in the PR description.

---

## Task 5: Final verification + PR

- [ ] **Step 1: Full local gate.**

```bash
pnpm typecheck && pnpm lint && pnpm exec prettier --check . && pnpm test
```

Expected: all green. (E2E unchanged this phase — no need to re-run, but `pnpm test:e2e` should still pass if you want belt-and-suspenders.)

- [ ] **Step 2: Open the PR** (do NOT auto-merge; production-affecting).

```bash
git push -u origin feat/ops-hardening
gh pr create --base main --title "feat(ops): migrate-on-deploy, env all-or-none validation, guardrails" --body "Operational Hardening per docs/superpowers/specs/2026-06-15-ops-hardening-design.md. Migrate-on-deploy is production-gated; verify on the first prod deploy that the build log shows migrations ran. No Sentry/CSP this phase (deferred). Branch protection applied via gh api (or note if it needs manual UI)."
```

- [ ] **Step 3: After merge, confirm on the first prod deploy** that the Vercel build log shows `[deploy-migrate] VERCEL_ENV=production → applying migrations` (and a preview deploy shows the skip line).

---

## Self-Review (completed by author)

**Spec coverage:** migrate-on-deploy → Task 2; env all-or-none → Task 1; CODEOWNERS + rollback runbook → Task 3; branch protection → Task 4; verification/PR → Task 5. All spec items mapped. (Sentry/CSP intentionally excluded per spec.)

**Placeholder scan:** All code/commands concrete. The `@veyis` owner and `veyis/setandshoot.com` repo slug are from the live remote; the branch-protection check contexts (`typecheck`/`lint`/`unit`/`e2e`) match the CI job names in `.github/workflows/ci.yml`.

**Type consistency:** `envSchema`/`Env` exported from `src/env-schema.ts` and consumed by `src/env.ts` (re-exports `Env`) and the test; `R2_KEYS` used consistently in the schema + refine. `vercel.ts` only changes the `buildCommand` string.

**Known follow-up (out of scope):** server-side Sentry capture and the CSP header remain deferred per the scope decision.
