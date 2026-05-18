#!/usr/bin/env bash
# Apply latest (or given) migration SQL on Hetzner via docker exec.
# Usage: pnpm supabase:db-push:hetzner
#        pnpm supabase:db-push:hetzner supabase/migrations/20260518050000_foundation.sql
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${SUPABASE_SSH_HOST:-root@5.78.213.173}"
COMPOSE_DIR="${SUPABASE_COMPOSE_DIR:-/opt/supabase/docker}"
MIGRATION="${1:-$(ls -1 "$ROOT"/supabase/migrations/*.sql 2>/dev/null | tail -1)}"

if [[ ! -f "$MIGRATION" ]]; then
  echo "Migration not found: $MIGRATION"
  exit 1
fi

echo "Applying $(basename "$MIGRATION") on $HOST ..."
ssh "$HOST" "docker compose -f $COMPOSE_DIR/docker-compose.yml exec -T db \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1" < "$MIGRATION"
echo "Migration applied."
