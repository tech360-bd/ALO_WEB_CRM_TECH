#!/usr/bin/env bash
# Ubuntu compatibility entrypoint. The exact-commit rollback implementation is
# shared with the AlmaLinux/PM2 deployment path and never resets the database
# or deletes .env, storage, uploads, or public/uploads.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PRODUCTION_APP_DIR="${PRODUCTION_APP_DIR:-/opt/alo-education}"
exec "$ROOT/scripts/rollback.sh" "$@"
