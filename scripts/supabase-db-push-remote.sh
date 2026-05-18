#!/usr/bin/env bash
# Apply migrations on the Hetzner host via docker exec (run ON the server).
set -euo pipefail

COMPOSE_DIR="${SUPABASE_COMPOSE_DIR:-/opt/supabase/docker}"
MIGRATION="${1:-$(ls -1 supabase/migrations/*.sql 2>/dev/null | tail -1)}"

if [[ ! -f "$MIGRATION" ]]; then
  echo "Migration file not found: $MIGRATION"
  exit 1
fi

echo "Applying $MIGRATION via supabase-db container..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T db \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$MIGRATION"

echo "Done."
