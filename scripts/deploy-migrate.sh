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
