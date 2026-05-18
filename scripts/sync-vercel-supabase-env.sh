#!/usr/bin/env bash
# Sync app env vars to Vercel (production, preview, development).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

URL="${NEXT_PUBLIC_SUPABASE_URL:-https://api.setandshoot.com}"
ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
SERVICE="${SUPABASE_SERVICE_ROLE_KEY:-${SERVICE_ROLE_KEY:-}}"
DB="${DATABASE_URL:-}"
PAYLOAD="${PAYLOAD_SECRET:-}"
SITE_PROD="${NEXT_PUBLIC_SITE_URL_PRODUCTION:-https://www.setandshoot.com}"
SITE_DEV="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"

if [[ -z "$ANON" ]]; then
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local"
  exit 1
fi

FLAGS=(--yes --force --non-interactive)

add_public() {
  vercel env add "$1" "$3" --value "$2" --no-sensitive "${FLAGS[@]}"
}

add_secret() {
  vercel env add "$1" "$3" --value "$2" --sensitive "${FLAGS[@]}"
}

add_plain_dev() {
  vercel env add "$1" development --value "$2" "${FLAGS[@]}"
}

for target in production preview development; do
  add_public NEXT_PUBLIC_SUPABASE_URL "$URL" "$target"
  add_public NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON" "$target"
done

add_public NEXT_PUBLIC_SITE_URL "$SITE_PROD" production
add_public NEXT_PUBLIC_SITE_URL "$SITE_PROD" preview
add_public NEXT_PUBLIC_SITE_URL "$SITE_DEV" development

if [[ -n "$SERVICE" ]]; then
  add_secret SUPABASE_SERVICE_ROLE_KEY "$SERVICE" production
  add_secret SUPABASE_SERVICE_ROLE_KEY "$SERVICE" preview
  add_plain_dev SUPABASE_SERVICE_ROLE_KEY "$SERVICE"
fi

if [[ -n "$DB" ]]; then
  add_secret DATABASE_URL "$DB" production
  add_secret DATABASE_URL "$DB" preview
  add_plain_dev DATABASE_URL "$DB"
fi

if [[ -n "$PAYLOAD" ]]; then
  add_secret PAYLOAD_SECRET "$PAYLOAD" production
  add_secret PAYLOAD_SECRET "$PAYLOAD" preview
  add_plain_dev PAYLOAD_SECRET "$PAYLOAD"
fi

echo "Vercel env sync complete. Run: vercel env ls"
