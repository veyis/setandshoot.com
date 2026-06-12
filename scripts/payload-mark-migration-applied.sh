#!/usr/bin/env bash
# Record a migration as applied without running SQL (when schema already exists from dev push).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NAME="${1:-}"
if [[ -z "$NAME" ]]; then
  echo "Usage: bash scripts/payload-mark-migration-applied.sh <migration_name>"
  echo "Example: bash scripts/payload-mark-migration-applied.sh 20260518_163754_stories_collections"
  exit 1
fi

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  exit 1
fi

export PAYLOAD_MIGRATION_NAME="$NAME"

node --input-type=module -e "
import pg from 'pg';

const name = process.env.PAYLOAD_MIGRATION_NAME;
const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
await c.connect();

const exists = await c.query(
  'SELECT 1 FROM payload.payload_migrations WHERE name = \$1 LIMIT 1',
  [name],
);
if (exists.rowCount) {
  console.log('Migration already recorded:', name);
  await c.end();
  process.exit(0);
}

const batch = await c.query(
  'SELECT COALESCE(MAX(batch), 0) + 1 AS next FROM payload.payload_migrations',
);
const next = batch.rows[0]?.next ?? 1;

await c.query(
  'INSERT INTO payload.payload_migrations (name, batch, created_at, updated_at) VALUES (\$1, \$2, NOW(), NOW())',
  [name, next],
);

console.log('Marked migration as applied:', name, 'batch', next);
await c.end();
"
