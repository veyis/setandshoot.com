#!/usr/bin/env bash
# Vercel "Ignored Build Step", wired up by vercel.json "ignoreCommand".
# Exit 0 skips the build; exit 1 builds. When in doubt, it builds.
#
# It skips only when every file changed since this branch's last successful
# deployment is outside what the site build reads:
#   - Markdown at the repo root (AGENTS.md, CLAUDE.md, README.md, ...)
#   - root dot-directories (.github/, .claude/, .agents/, .cursor/, ...)
#   - docs/, analysis/, tmp/, outputs/, tests/, test/, e2e/,
#     test-results/, playwright-report/
# Markdown below the root (for example content/blog/*.md) still builds,
# because sites render it.
#
# Canonical copy: tier1/pxlpeak.com/scripts/vercel-ignore-build.sh in
# ~/Desktop/websites. Edit that copy, then copy it to each site.
set -u

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$prev" ] || ! git cat-file -e "${prev}^{commit}" 2>/dev/null; then
  echo "ignore-build: last deployed commit is not in this clone; building."
  exit 1
fi

if git diff --quiet "$prev" HEAD -- . \
  ':(exclude,glob)*.md' \
  ':(exclude,glob).*/**' \
  ':(exclude,glob)docs/**' \
  ':(exclude,glob)analysis/**' \
  ':(exclude,glob)tmp/**' \
  ':(exclude,glob)outputs/**' \
  ':(exclude,glob)tests/**' \
  ':(exclude,glob)test/**' \
  ':(exclude,glob)e2e/**' \
  ':(exclude,glob)test-results/**' \
  ':(exclude,glob)playwright-report/**'; then
  echo "ignore-build: only non-site files changed since ${prev}; skipping."
  exit 0
fi

echo "ignore-build: site files changed since ${prev}; building."
exit 1
