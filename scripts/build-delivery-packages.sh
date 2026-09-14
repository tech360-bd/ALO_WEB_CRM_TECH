#!/usr/bin/env bash
# ALO Education — Portable Wrapper (fixed hardcoded Mac paths)
# Delegates to build-delivery-packages-portable.sh which uses relative paths (works on VPS)
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
exec bash "$SCRIPT_DIR/build-delivery-packages-portable.sh" "$@"
