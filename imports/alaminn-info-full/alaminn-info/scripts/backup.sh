#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  Alaminn.info — MySQL database backup (cPanel cron compatible)
# ══════════════════════════════════════════════════════════════════════════════
#
#  PURPOSE
#    Creates a timestamped, gzip-compressed mysqldump of the Alaminn.info
#    MySQL database and writes a SHA-256 checksum alongside it. Enforces
#    a configurable retention policy and prevents concurrent runs via
#    flock. Designed to run via cPanel cron (no TTY, minimal PATH).
#
#  USAGE
#    bash scripts/backup.sh
#    ./scripts/backup.sh
#    # cPanel cron example (daily at 02:00):
#    # 0 2 * * * /home/aloeduca/alaminn.info/scripts/backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1
#
#  PREREQUISITES
#    - mysqldump, gzip, sha256sum, flock available on PATH (absolute
#      paths are auto-detected and used; common cPanel locations are
#      tried as fallback).
#    - A readable .env file at <project_root>/.env containing either:
#        DATABASE_URL=mysql://user:pass@host:port/db
#      OR
#        DB_HOST=..., DB_PORT=..., DB_DATABASE=..., DB_USERNAME=..., DB_PASSWORD=...
#    - Write permission on <project_root>/storage/backups/ and
#      <project_root>/storage/logs/ (created automatically).
#
#  CONFIGURATION (env vars, all optional)
#    BACKUP_RETENTION_DAYS   Days to keep backups (default 30).
#    APP_ROOT                Project root (default: parent of this script).
#    BACKUP_DIR              Override backup output directory.
#    LOG_DIR                 Override log directory.
#    LOCK_FILE               Override flock lock file
#                            (default /tmp/alaminn-backup.lock).
#
#  EXIT CODES
#    0  Backup created successfully (or skipped because another run
#       holds the lock).
#    1  Backup failed (mysqldump error, missing .env, no creds, IO
#       error, etc.). Details are written to the log file and stderr.
#
#  SECURITY
#    - Credentials are read from .env and written to a mktemp(1)
#      defaults-extra-file with mode 0600, used only as
#      `mysqldump --defaults-extra-file=<file>`. They are NEVER passed
#      on the command line (where `ps` could leak them) and NEVER
#      printed to stdout or the log file.
#    - The temp creds file is removed on exit via a trap.
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_ROOT="${APP_ROOT:-$PROJECT_ROOT}"
BACKUP_DIR="${BACKUP_DIR:-$APP_ROOT/storage/backups}"
LOG_DIR="${LOG_DIR:-$APP_ROOT/storage/logs}"
LOG_FILE="$LOG_DIR/backup.log"
LOCK_FILE="${LOCK_FILE:-/tmp/alaminn-backup.lock}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# ── Resolve binary absolute paths (cron PATH is minimal) ───────────────────
resolve_bin() {
  local name="$1" path p
  path="$(command -v "$name" 2>/dev/null || true)"
  if [ -n "$path" ]; then printf '%s' "$path"; return 0; fi
  for p in /usr/bin/"$name" /bin/"$name" /usr/local/bin/"$name" \
           /usr/local/sbin/"$name" /opt/cpanel/bin/"$name"; do
    if [ -x "$p" ]; then printf '%s' "$p"; return 0; fi
  done
  printf '%s' "$name"  # last resort: bare name (let shell search PATH)
}

MYSQLDUMP="$(resolve_bin mysqldump)"
MYSQL="$(resolve_bin mysql)"
GZIP="$(resolve_bin gzip)"
SHA256SUM="$(resolve_bin sha256sum)"
FLOCK="$(resolve_bin flock)"
FIND="$(resolve_bin find)"
MKTEMP="$(resolve_bin mktemp)"

# ── Color (only when stdout is a TTY) ──────────────────────────────────────
if [ -t 1 ]; then
  C_GREEN=$'\033[1;32m'
  C_RED=$'\033[1;31m'
  C_CYAN=$'\033[1;36m'
  C_RESET=$'\033[0m'
else
  C_GREEN=""
  C_RED=""
  C_CYAN=""
  C_RESET=""
fi

# ── Logging ────────────────────────────────────────────────────────────────
_ts() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
  local msg
  msg="[$(_ts)] $*"
  printf '%s\n' "$msg"
  printf '%s\n' "$msg" >> "$LOG_FILE"
}

err() {
  local msg
  msg="[$(_ts)] [ERROR] $*"
  printf '%s%s%s\n' "$C_RED" "$msg" "$C_RESET" >&2
  printf '%s\n' "$msg" >> "$LOG_FILE"
}

ok() {
  printf '%s%s%s\n' "$C_GREEN" "$*" "$C_RESET"
}

# ── .env loader (handles quotes + comments; never prints values) ───────────
load_env() {
  local env_file="$PROJECT_ROOT/.env"
  if [ ! -f "$env_file" ]; then
    err ".env file not found at $env_file"
    exit 1
  fi
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    # Strip leading whitespace.
    line="${line#"${line%%[![:space:]]*}"}"
    # Skip blanks and full-line comments.
    [ -z "$line" ] && continue
    [ "${line:0:1}" = "#" ] && continue
    # Must contain '='.
    case "$line" in
      *=*) ;;
      *) continue ;;
    esac
    key="${line%%=*}"
    val="${line#*=}"
    # Strip surrounding matching quotes (single or double).
    case "$val" in
      '"'*'"') val="${val:1:${#val}-2}" ;;
      "'"*"'") val="${val:1:${#val}-2}" ;;
    esac
    # Export into our process. Do NOT print or log.
    export "$key=$val"
  done < "$env_file"
}

# ── URL-decode helper (for percent-encoded passwords in DATABASE_URL) ──────
urldecode() {
  local s="${1//+/ }"
  printf '%b' "${s//%/\\x}"
}

# ── Parse DB credentials from DATABASE_URL or DB_* env vars ────────────────
parse_db_creds() {
  if [[ "${DATABASE_URL:-}" =~ ^mysql://([^:@]+):([^@]*)@([^:/]+)(:([0-9]+))?/([^?]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="$(urldecode "${BASH_REMATCH[2]}")"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[5]:-3306}"
    DB_NAME="${BASH_REMATCH[6]}"
  else
    # Fall back to individual env vars.
    DB_USER="${DB_USERNAME:-}"
    DB_PASS="${DB_PASSWORD:-}"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-3306}"
    DB_NAME="${DB_DATABASE:-}"
  fi

  if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    err "Could not determine DB credentials."
    err "Set DATABASE_URL=mysql://user:pass@host:port/db in .env,"
    err "or set DB_USERNAME/DB_PASSWORD/DB_DATABASE (and optionally DB_HOST/DB_PORT)."
    exit 1
  fi
}

# ── Write a 0600 defaults-extra-file (the safe way to pass creds) ──────────
#   mysqldump reads this file instead of argv, so `ps` cannot leak the pass.
CRED_FILE=""
write_creds_file() {
  CRED_FILE="$("$MKTEMP" /tmp/alaminn-creds.XXXXXX)" || {
    err "mktemp failed — cannot safely store credentials"
    exit 1
  }
  chmod 600 "$CRED_FILE"
  printf '[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n' \
    "$DB_USER" "$DB_PASS" "$DB_HOST" "$DB_PORT" > "$CRED_FILE"
}

cleanup() {
  if [ -n "$CRED_FILE" ] && [ -f "$CRED_FILE" ]; then
    rm -f "$CRED_FILE"
  fi
}
trap cleanup EXIT

# ── Human-readable byte count ──────────────────────────────────────────────
human_size() {
  local b="$1"
  if [ "$b" -lt 1024 ]; then
    printf '%d B' "$b"
  elif [ "$b" -lt 1048576 ]; then
    awk -v b="$b" 'BEGIN{printf "%.1f KB", b/1024}'
  elif [ "$b" -lt 1073741824 ]; then
    awk -v b="$b" 'BEGIN{printf "%.2f MB", b/1048576}'
  else
    awk -v b="$b" 'BEGIN{printf "%.2f GB", b/1073741824}'
  fi
}

# ── Main ───────────────────────────────────────────────────────────────────
main() {
  # Ensure directories exist.
  mkdir -p "$BACKUP_DIR" "$LOG_DIR"

  # Acquire lock — exit cleanly if another backup is already running.
  exec 9>"$LOCK_FILE"
  if ! "$FLOCK" -n 9; then
    log "Another backup is already running (lock $LOCK_FILE held). Skipping."
    exit 0
  fi

  load_env
  parse_db_creds
  write_creds_file

  local ts backup_name backup_path sha_path size_bytes start_ts end_ts duration
  ts="$(date '+%Y%m%d_%H%M%S')"
  backup_name="alaminn_info_${ts}.sql.gz"
  backup_path="$BACKUP_DIR/$backup_name"
  sha_path="${backup_path}.sha256"

  start_ts="$(date +%s)"
  log "── Backup start ───────────────────────────────────────"
  # Log everything EXCEPT the password. The password is in CRED_FILE.
  log "Database : $DB_NAME @ $DB_HOST:$DB_PORT (user: $DB_USER)"
  log "Backup to: $backup_path"
  log "Retention: $RETENTION_DAYS days"

  # Run mysqldump | gzip. With pipefail, any failure propagates.
  # Capture mysqldump's stderr to a temp file so we can report it on failure
  # (mysqldump normally writes only warnings/info to stderr).
  local dump_err_file
  dump_err_file="$("$MKTEMP" /tmp/alaminn-dump-err.XXXXXX)" || {
    err "mktemp failed for dump stderr capture"
    exit 1
  }
  if ! "$MYSQLDUMP" --defaults-extra-file="$CRED_FILE" \
        --single-transaction --routines --triggers --events \
        --default-character-set=utf8mb4 \
        "$DB_NAME" 2>"$dump_err_file" \
        | "$GZIP" -9 > "$backup_path"; then
    err "mysqldump failed (stderr below):"
    if [ -s "$dump_err_file" ]; then
      while IFS= read -r ln; do err "  $ln"; done < "$dump_err_file"
    fi
    rm -f "$dump_err_file" "$backup_path" "$sha_path"
    exit 1
  fi
  # Surface any non-fatal warnings (e.g. "mysqldump: [Warning] ...") to the log.
  if [ -s "$dump_err_file" ]; then
    while IFS= read -r ln; do log "  (mysqldump) $ln"; done < "$dump_err_file"
  fi
  rm -f "$dump_err_file"

  if [ ! -s "$backup_path" ]; then
    err "Backup file is empty: $backup_path"
    rm -f "$backup_path" "$sha_path"
    exit 1
  fi

  # SHA-256 checksum alongside the backup.
  "$SHA256SUM" "$backup_path" > "$sha_path"

  size_bytes="$(wc -c < "$backup_path" | tr -d '[:space:]')"
  end_ts="$(date +%s)"
  duration=$((end_ts - start_ts))

  log "Backup OK : $backup_name ($(human_size "$size_bytes"), ${duration}s)"

  # Verify gzip integrity immediately (cheap sanity check).
  if ! "$GZIP" -t "$backup_path" 2>/dev/null; then
    err "Backup gzip integrity check FAILED — file may be corrupt."
    exit 1
  fi

  # Retention — prune backups older than RETENTION_DAYS days.
  local pruned=0 orphan
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    rm -f "$f" "${f}.sha256"
    pruned=$((pruned + 1))
  done < <("$FIND" "$BACKUP_DIR" -maxdepth 1 -type f \
            -name 'alaminn_info_*.sql.gz' -mtime +"$RETENTION_DAYS" -print 2>/dev/null || true)

  # Also remove orphaned .sha256 files (no matching .sql.gz, or stale).
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    orphan="${f%.sha256}"
    if [ ! -f "$orphan" ]; then
      rm -f "$f"
    fi
  done < <("$FIND" "$BACKUP_DIR" -maxdepth 1 -type f \
            -name 'alaminn_info_*.sql.gz.sha256' -mtime +"$RETENTION_DAYS" -print 2>/dev/null || true)

  if [ "$pruned" -gt 0 ]; then
    log "Pruned   : $pruned backup(s) older than $RETENTION_DAYS day(s)"
  fi

  log "SHA-256  : $(awk '{print $1}' "$sha_path")"
  log "── Backup complete ────────────────────────────────────"
  ok "✓ Backup created: $backup_name"
  exit 0
}

main "$@"
