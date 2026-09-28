#!/usr/bin/env bash
# Ubuntu compatibility entrypoint. Keep one health implementation so the
# systemd and AlmaLinux/cPanel paths cannot drift.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec "$ROOT/scripts/health-check.sh" --systemd "$@"
