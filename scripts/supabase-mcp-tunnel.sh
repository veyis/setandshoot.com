#!/usr/bin/env bash
# Forwards local :8080 → Hetzner Kong :8000 for self-hosted Supabase MCP.
# Keep this running while using Cursor MCP. Requires one-time Kong IP allowlist on the server.
set -euo pipefail

HOST="${SUPABASE_SSH_HOST:-root@5.78.213.173}"
LOCAL_PORT="${SUPABASE_MCP_LOCAL_PORT:-8080}"
REMOTE_PORT="${SUPABASE_MCP_REMOTE_PORT:-8000}"

echo "Supabase MCP tunnel: http://127.0.0.1:${LOCAL_PORT}/mcp → ${HOST}:${REMOTE_PORT}"
echo "Press Ctrl+C to stop."
exec ssh -N -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" "${HOST}"
