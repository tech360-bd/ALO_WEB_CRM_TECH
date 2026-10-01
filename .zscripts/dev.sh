#!/usr/bin/env bash
# Local development only; same Node 22/npm toolchain as the application.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/assert-node22.cjs
exec npm run dev -- --hostname 0.0.0.0
