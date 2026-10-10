#!/usr/bin/env bash
# LEGACY / NOT USED FOR CURRENT PRODUCTION
echo "DISABLED: legacy package layout is not an approved Hostinger artifact. See HOSTINGER-RUNTIME-STANDARD.md." >&2
exit 1
# ALO Education — Portable Wrapper (fixed hardcoded Mac paths)
# Delegates to build-delivery-packages-portable.sh which uses relative paths (works on VPS)
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
exec bash "$SCRIPT_DIR/build-delivery-packages-portable.sh" "$@"
