#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

export PAYLOAD_CONFIG_PATH=src/payload/payload.config.ts

# Non-interactive migrate when dev-mode schema was already pushed
if [[ "${1:-}" == "migrate" && "${PAYLOAD_MIGRATE_FORCE:-}" == "1" ]]; then
  printf 'y\n' | pnpm exec payload "$@"
  exit $?
fi

exec pnpm exec payload "$@"
