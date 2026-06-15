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
Get the prod connection string from the **Neon dashboard** (Vercel won't surface it —
`DATABASE_URL` is a Sensitive var and `vercel env pull` returns it empty):

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

- Migrations run automatically on production deploys (`scripts/deploy-migrate.sh`,
  gated on `VERCEL_ENV=production`). Do **not** run Payload dev-mode `push` against the
  shared prod DB — it leaves the "data-loss" prompt state the deploy script has to
  auto-confirm.
- Rotate the Neon DB password if a connection string was ever shared
  (see `rotate-exposed-secrets.md`).
