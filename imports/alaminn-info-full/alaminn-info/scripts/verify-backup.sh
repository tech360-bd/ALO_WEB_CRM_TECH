#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  Alaminn.info — Backup file verifier
# ══════════════════════════════════════════════════════════════════════════════
#
#  PURPOSE
#    Verifies a gzip-compressed mysqldump backup file is complete and
#    contains the expected Alaminn.info schema. Does NOT touch the
#    database — purely inspects the backup file.
#
#  Checks performed (all must pass):
#    1. File exists and is non-empty.
#    2. SHA-256 checksum matches the .sha256 sibling (if present).
#    3. gzip integrity check passes (gunzip -t).
#    4. The dump contains exactly EXPECTED_TABLES (55) CREATE TABLE
#       statements.
#    5. Key tables are present in the dump:
#         User, HigherStudyUniversity, HigherStudyScholarship,
#         EnglishLearningCourse.
#
#  USAGE
#    bash scripts/verify-backup.sh /path/to/backup.sql.gz
#    bash scripts/verify-backup.sh                                # latest
#    bash scripts/verify-backup.sh alaminn_info_20260101_020000.sql.gz
#
#  PREREQUISITES
#    - gunzip, sha256sum, grep available (absolute paths auto-detected).
#    - Backup file under <project_root>/storage/backups/ (or pass an
#      absolute path).
#
#  EXIT CODES
#    0  All checks PASSED.
#    1  One or more checks FAILED (see output for details).
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_ROOT="${APP_ROOT:-$PROJECT_ROOT}"
BACKUP_DIR="${BACKUP_DIR:-$APP_ROOT/storage/backups}"

# Expected counts for the Alaminn.info production schema.
EXPECTED_TABLES="${EXPECTED_TABLES:-55}"
# Space-separated list of table names that MUST appear in the dump.
KEY_TABLES="${KEY_TABLES:-User HigherStudyUniversity HigherStudyScholarship EnglishLearningCourse}"

# ── Resolve binaries ───────────────────────────────────────────────────────
resolve_bin() {
  local name="$1" path p
  path="$(command -v "$name" 2>/dev/null || true)"
  if [ -n "$path" ]; then printf '%s' "$path"; return 0; fi
  for p in /usr/bin/"$name" /bin/"$name" /usr/local/bin/"$name" \
           /usr/local/sbin/"$name" /opt/cpanel/bin/"$name"; do
    if [ -x "$p" ]; then printf '%s' "$p"; return 0; fi
  done
  printf '%s' "$name"
}
GUNZIP="$(resolve_bin gunzip)"
SHA256SUM="$(resolve_bin sha256sum)"
GREP="$(resolve_bin grep)"
FIND="$(resolve_bin find)"
LS="$(resolve_bin ls)"

# ── Color (only when stdout is a TTY) ──────────────────────────────────────
if [ -t 1 ]; then
  C_GREEN=$'\033[1;32m'
  C_RED=$'\033[1;31m'
  C_YELLOW=$'\033[1;33m'
  C_CYAN=$'\033[1;36m'
  C_RESET=$'\033[0m'
else
  C_GREEN="" ; C_RED="" ; C_YELLOW="" ; C_CYAN="" ; C_RESET=""
fi

# ── Output helpers ─────────────────────────────────────────────────────────
pass() { printf '  %s✓%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
fail() { printf '  %s✗%s %s\n' "$C_RED" "$C_RESET" "$*"; FAILURES=$((FAILURES + 1)); }
info() { printf '  %s·%s %s\n' "$C_CYAN" "$C_RESET" "$*"; }

FAILURES=0

# ── Find latest backup ─────────────────────────────────────────────────────
latest_backup() {
  "$LS" -1t "$BACKUP_DIR"/alaminn_info_*.sql.gz 2>/dev/null | head -n 1 || true
}

# ── Resolve backup path ────────────────────────────────────────────────────
resolve_backup_path() {
  local arg="$1"
  case "$arg" in
    /*) printf '%s' "$arg" ;;
    *)  if [ -f "$BACKUP_DIR/$arg" ]; then
          printf '%s' "$BACKUP_DIR/$arg"
        else
          printf '%s' "$arg"
        fi ;;
  esac
}

# ── Main ───────────────────────────────────────────────────────────────────
main() {
  local backup_file
  if [ "$#" -ge 1 ] && [ -n "$1" ]; then
    backup_file="$(resolve_backup_path "$1")"
  else
    backup_file="$(latest_backup)"
    if [ -z "$backup_file" ]; then
      printf '%sNo backup file specified and none found in %s%s\n' \
        "$C_RED" "$BACKUP_DIR" "$C_RESET" >&2
      printf 'Usage: bash scripts/verify-backup.sh <backup-file.sql.gz>\n' >&2
      exit 1
    fi
    info "Verifying most recent backup: $(basename "$backup_file")"
  fi

  printf 'Verifying: %s\n' "$backup_file"
  printf 'Expected table count: %s\n' "$EXPECTED_TABLES"
  printf 'Key tables: %s\n' "$KEY_TABLES"
  printf -- '--------------------------------------------------\n'

  # Check 1: file exists and is non-empty.
  if [ ! -f "$backup_file" ]; then
    fail "File does not exist: $backup_file"
    printf '\n%sRESULT: FAIL%s (file missing)\n' "$C_RED" "$C_RESET"
    exit 1
  fi
  if [ ! -s "$backup_file" ]; then
    fail "File is empty: $backup_file"
    printf '\n%sRESULT: FAIL%s (empty file)\n' "$C_RED" "$C_RESET"
    exit 1
  fi
  pass "File exists and is non-empty ($(wc -c < "$backup_file" | tr -d '[:space:]') bytes)"

  # Check 2: SHA-256 checksum (if .sha256 sibling exists).
  local sha_file="${backup_file}.sha256"
  if [ -f "$sha_file" ]; then
    local sha_dir sha_base
    sha_dir="$(cd "$(dirname "$backup_file")" && pwd)"
    sha_base="$(basename "$backup_file")"
    if ( cd "$sha_dir" && "$SHA256SUM" -c "${sha_base}.sha256" >/dev/null 2>&1 ); then
      pass "SHA-256 checksum verified"
    else
      fail "SHA-256 checksum MISMATCH"
    fi
  else
    info "No .sha256 file found — checksum check skipped"
  fi

  # Check 3: gzip integrity.
  if "$GUNZIP" -t "$backup_file" 2>/dev/null; then
    pass "gzip integrity OK (gunzip -t)"
  else
    fail "gzip integrity FAILED (gunzip -t)"
    printf '\n%sRESULT: FAIL%s (gzip integrity)\n' "$C_RED" "$C_RESET"
    exit 1
  fi

  # Check 4: count CREATE TABLE statements.
  # mysqldump emits lines like:  CREATE TABLE `User` (
  local create_count
  create_count="$("$GUNZIP" -c "$backup_file" | "$GREP" -cE '^CREATE TABLE[[:space:]]' || true)"
  if [ "$create_count" -eq "$EXPECTED_TABLES" ]; then
    pass "CREATE TABLE count: $create_count (== expected $EXPECTED_TABLES)"
  else
    fail "CREATE TABLE count: $create_count (expected $EXPECTED_TABLES)"
  fi

  # Check 5: key tables present.
  local t found
  for t in $KEY_TABLES; do
    # Match `CREATE TABLE `User` (` — backticks are emitted by mysqldump by default.
    if "$GUNZIP" -c "$backup_file" | "$GREP" -qE "^CREATE TABLE \`${t}\` "; then
      pass "Key table present: $t"
    else
      fail "Key table MISSING: $t"
    fi
  done

  # ── Result ──────────────────────────────────────────────────────────────
  printf -- '--------------------------------------------------\n'
  if [ "$FAILURES" -eq 0 ]; then
    printf '%sRESULT: PASS%s — all checks succeeded\n' "$C_GREEN" "$C_RESET"
    exit 0
  else
    printf '%sRESULT: FAIL%s — %d check(s) failed\n' "$C_RED" "$C_RESET" "$FAILURES"
    exit 1
  fi
}

main "$@"
