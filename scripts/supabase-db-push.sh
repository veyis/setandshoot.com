#!/usr/bin/env bash
# Push supabase/migrations to the Hetzner Postgres instance.
#
# Option A — from your Mac (tunnel must be running):
#   ssh -L 54322:127.0.0.1:5432 root@5.78.213.173
#   export DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@127.0.0.1:54322/postgres"
#   pnpm supabase:db-push
#
# Option B — on the server:
#   pnpm supabase:db-push:remote
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  echo "Example (with SSH tunnel):"
  echo '  export DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:54322/postgres"'
  exit 1
fi

pnpm exec supabase db push --db-url "$DATABASE_URL"
