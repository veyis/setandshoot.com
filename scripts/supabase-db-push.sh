#!/usr/bin/env bash
# Apply supabase/migrations to Postgres (Neon or any DATABASE_URL).
# Loads .env.local when present.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Add your Neon connection string to .env.local"
  exit 1
fi

pnpm exec supabase db push --db-url "$DATABASE_URL"
