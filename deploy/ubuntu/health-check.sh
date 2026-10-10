#!/usr/bin/env bash
# LEGACY / NOT USED FOR CURRENT PRODUCTION — delegates only to a disabled legacy diagnostic.
# Ubuntu compatibility entrypoint. Keep one health implementation so the
# systemd and AlmaLinux/cPanel paths cannot drift.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec "$ROOT/scripts/health-check.sh" --systemd "$@"
