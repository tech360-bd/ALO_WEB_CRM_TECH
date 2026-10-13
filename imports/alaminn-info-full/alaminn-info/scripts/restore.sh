#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  Alaminn.info — MySQL database restore (interactive, cPanel compatible)
# ══════════════════════════════════════════════════════════════════════════════
#
#  PURPOSE
#    Restores the Alaminn.info MySQL database from a gzip-compressed
#    mysqldump file. Before overwriting the live DB it ALWAYS creates a
#    pre-restore safety snapshot so the operation can be undone. Verifies
#    the SHA-256 checksum of the supplied backup (if a .sha256 sibling
#    exists) and confirms the restore by counting tables post-import.
#
#  USAGE
#    bash scripts/restore.sh /path/to/backup.sql.gz
#    bash scripts/restore.sh                                   # interactive
#    bash scripts/restore.sh alaminn_info_20260101_020000.sql.gz
#
#  PREREQUISITES
#    - mysql, mysqldump, gzip, sha256sum, flock available (absolute
#      paths are auto-detected; common cPanel locations are tried).
#    - A readable .env at <project_root>/.env (same format as backup.sh).
#    - Write permission on storage/backups/ and storage/logs/.
#
#  EXIT CODES
#    0  Restore completed and verified.
#    1  Restore aborted (file not found, checksum mismatch, user
#       declined confirmation, import error, table count mismatch).
#
#  SAFETY
#    - ALWAYS creates a pre-restore snapshot BEFORE importing.
#    - Requires interactive confirmation (type 'RESTORE' literally).
#    - Credentials are passed via a 0600 defaults-extra-file; never
#      on argv, never printed.
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_ROOT="${APP_ROOT:-$PROJECT_ROOT}"
BACKUP_DIR="${BACKUP_DIR:-$APP_ROOT/storage/backups}"
LOG_DIR="${LOG_DIR:-$APP_ROOT/storage/logs}"
LOG_FILE="$LOG_DIR/restore.log"
LOCK_FILE="${LOCK_FILE:-/tmp/alaminn-restore.lock}"

# Expected table count for Alaminn.info production schema (Prisma models).
EXPECTED_TABLES="${EXPECTED_TABLES:-55}"

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
MYSQLDUMP="$(resolve_bin mysqldump)"
MYSQL="$(resolve_bin mysql)"
GUNZIP="$(resolve_bin gunzip)"
SHA256SUM="$(resolve_bin sha256sum)"
FLOCK="$(resolve_bin flock)"
MKTEMP="$(resolve_bin mktemp)"

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

# ── Logging ────────────────────────────────────────────────────────────────
_ts() { date '+%Y-%m-%d %H:%M:%S'; }
log()  { local m="[$(_ts)] $*"; printf '%s\n' "$m"; printf '%s\n' "$m" >> "$LOG_FILE"; }
err()  { local m="[$(_ts)] [ERROR] $*"; printf '%s%s%s\n' "$C_RED" "$m" "$C_RESET" >&2; printf '%s\n' "$m" >> "$LOG_FILE"; }
ok()   { printf '%s%s%s\n' "$C_GREEN" "$*" "$C_RESET"; }
warn() { printf '%s%s%s\n' "$C_YELLOW" "$*" "$C_RESET"; }

# ── .env loader (handles quotes + comments; never prints values) ───────────
load_env() {
  local env_file="$PROJECT_ROOT/.env"
  if [ ! -f "$env_file" ]; then
    err ".env file not found at $env_file"
    exit 1
  fi
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line#"${line%%[![:space:]]*}"}"
    [ -z "$line" ] && continue
    [ "${line:0:1}" = "#" ] && continue
    case "$line" in *=*) ;; *) continue ;; esac
    key="${line%%=*}"
    val="${line#*=}"
    case "$val" in
      '"'*'"') val="${val:1:${#val}-2}" ;;
      "'"*"'") val="${val:1:${#val}-2}" ;;
    esac
    export "$key=$val"
  done < "$env_file"
}

urldecode() {
  local s="${1//+/ }"
  printf '%b' "${s//%/\\x}"
}

parse_db_creds() {
  if [[ "${DATABASE_URL:-}" =~ ^mysql://([^:@]+):([^@]*)@([^:/]+)(:([0-9]+))?/([^?]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="$(urldecode "${BASH_REMATCH[2]}")"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[5]:-3306}"
    DB_NAME="${BASH_REMATCH[6]}"
  else
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
cleanup() { [ -n "$CRED_FILE" ] && [ -f "$CRED_FILE" ] && rm -f "$CRED_FILE"; }
trap cleanup EXIT

# ── Resolve backup file path ───────────────────────────────────────────────
resolve_backup_path() {
  local arg="$1"
  # Absolute path → use as-is.
  case "$arg" in
    /*) printf '%s' "$arg"; return ;;
  esac
  # Bare filename or relative path → try BACKUP_DIR first, then CWD.
  if [ -f "$BACKUP_DIR/$arg" ]; then
    printf '%s' "$BACKUP_DIR/$arg"
    return
  fi
  printf '%s' "$(cd "$(pwd)" && pwd)/$arg"
}

# ── List available backups (newest last) ───────────────────────────────────
list_backups() {
  if [ ! -d "$BACKUP_DIR" ]; then
    err "Backup directory does not exist: $BACKUP_DIR"
    return 1
  fi
  # shellcheck disable=SC2012
  ls -1t "$BACKUP_DIR"/alaminn_info_*.sql.gz 2>/dev/null | tac 2>/dev/null \
    || ls -1 "$BACKUP_DIR"/alaminn_info_*.sql.gz 2>/dev/null
}

# ── Verify SHA-256 checksum (if .sha256 sibling exists) ────────────────────
verify_sha256() {
  local file="$1" sha_file="${1}.sha256"
  if [ ! -f "$sha_file" ]; then
    warn "No checksum file found: $sha_file — skipping checksum verification."
    return 0
  fi
  # sha256sum -c reads "HASH  FILENAME" lines and verifies FILENAME.
  # We cd into the directory so the relative filename in the .sha256 matches.
  local dir base
  dir="$(cd "$(dirname "$file")" && pwd)"
  base="$(basename "$file")"
  if ( cd "$dir" && "$SHA256SUM" -c "$base.sha256" >/dev/null 2>&1 ); then
    ok "✓ SHA-256 checksum verified."
    return 0
  else
    err "SHA-256 checksum FAILED for $file"
    return 1
  fi
}

# ── Create a pre-restore safety backup ─────────────────────────────────────
make_pre_restore_backup() {
  local pre_path pre_name ts
  ts="$(date '+%Y%m%d_%H%M%S')"
  pre_name="pre-restore_${ts}.sql.gz"
  pre_path="$BACKUP_DIR/$pre_name"

  log "Creating pre-restore safety backup: $pre_name"
  if ! "$MYSQLDUMP" --defaults-extra-file="$CRED_FILE" \
        --single-transaction --routines --triggers --events \
        --default-character-set=utf8mb4 \
        "$DB_NAME" 2>>"$LOG_FILE" | gzip -9 > "$pre_path"; then
    err "Pre-restore backup FAILED — aborting restore (live DB untouched)."
    rm -f "$pre_path"
    return 1
  fi
  if [ -s "$pre_path" ]; then
    "$SHA256SUM" "$pre_path" > "${pre_path}.sha256"
    log "  ✓ pre-restore backup: $pre_name ($(wc -c < "$pre_path" | tr -d '[:space:]') bytes)"
    PRE_RESTORE_PATH="$pre_path"
    return 0
  else
    err "Pre-restore backup file is empty — aborting restore."
    rm -f "$pre_path"
    return 1
  fi
}

# ── Count tables in the live database ──────────────────────────────────────
count_tables() {
  "$MYSQL" --defaults-extra-file="$CRED_FILE" -N -B \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" 2>/dev/null \
    | tr -d '[:space:]'
}

PRE_RESTORE_PATH=""

# ── Main ───────────────────────────────────────────────────────────────────
main() {
  mkdir -p "$BACKUP_DIR" "$LOG_DIR"

  # Acquire lock so two restores can't run simultaneously.
  exec 9>"$LOCK_FILE"
  if ! "$FLOCK" -n 9; then
    err "Another restore is already running (lock $LOCK_FILE held). Aborting."
    exit 1
  fi

  local backup_arg backup_file
  if [ "$#" -ge 1 ] && [ -n "$1" ]; then
    backup_arg="$1"
    backup_file="$(resolve_backup_path "$backup_arg")"
  else
    # Interactive: list available backups and ask the user to pick.
    echo "Available backups in $BACKUP_DIR:"
    echo
    local backups i=0 choice
    backups="$(list_backups)" || {
      err "No backups found in $BACKUP_DIR"
      exit 1
    }
    if [ -z "$backups" ]; then
      err "No backups found in $BACKUP_DIR"
      exit 1
    fi
    # Print numbered list (newest LAST so the most recent is at the bottom).
    local arr=()
    while IFS= read -r b; do
      i=$((i + 1))
      arr+=("$b")
      printf '  %d) %s\n' "$i" "$(basename "$b")"
    done <<< "$backups"
    echo
    read -r -p "Enter number to restore (1-${#arr[@]}): " choice
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#arr[@]}" ]; then
      err "Invalid selection: $choice"
      exit 1
    fi
    backup_file="${arr[$((choice - 1))]}"
  fi

  # Validate file existence.
  if [ ! -f "$backup_file" ]; then
    err "Backup file not found: $backup_file"
    [ -d "$BACKUP_DIR" ] && err "(Looked in: $BACKUP_DIR)"
    exit 1
  fi

  # Validate file extension / non-empty.
  case "$backup_file" in
    *.sql.gz) ;;
    *) warn "File does not end in .sql.gz: $backup_file — continuing anyway." ;;
  esac
  if [ ! -s "$backup_file" ]; then
    err "Backup file is empty: $backup_file"
    exit 1
  fi

  log "── Restore start ──────────────────────────────────────"
  log "Backup file: $backup_file"
  log "Size       : $(wc -c < "$backup_file" | tr -d '[:space:]') bytes"

  # Step 1: verify checksum (warn-only if missing).
  if ! verify_sha256 "$backup_file"; then
    err "Aborting restore due to checksum mismatch."
    exit 1
  fi

  # Step 2: gzip integrity check.
  if ! "$GUNZIP" -t "$backup_file" 2>/dev/null; then
    err "gzip integrity check FAILED — file may be corrupt."
    exit 1
  fi
  ok "✓ gzip integrity OK."

  # Step 3: load DB credentials.
  load_env
  parse_db_creds
  write_creds_file

  log "Database   : $DB_NAME @ $DB_HOST:$DB_PORT (user: $DB_USER)"

  # Step 4: interactive confirmation. MUST type RESTORE literally.
  # In non-TTY mode (cron), read returns non-zero on EOF — we treat that
  # as a declined confirmation (fail-closed) instead of letting set -e
  # kill the script silently.
  printf '%sThis will OVERWRITE the current database "%s".%s\n' "$C_RED" "$DB_NAME" "$C_RESET" >&2
  printf 'A pre-restore safety backup will be created first.\n' >&2
  if ! read -r -p "Type 'RESTORE' to confirm: " confirm || [ "$confirm" != "RESTORE" ]; then
    log "Restore declined (input: '${confirm:-<empty>}'). No changes made."
    warn "Restore cancelled."
    exit 1
  fi

  # Step 5: pre-restore safety backup.
  if ! make_pre_restore_backup; then
    exit 1
  fi

  # Step 6: import.
  log "Importing backup into $DB_NAME ..."
  local import_err_file
  import_err_file="$("$MKTEMP" /tmp/alaminn-restore-err.XXXXXX)"
  if ! "$GUNZIP" -c "$backup_file" \
        | "$MYSQL" --defaults-extra-file="$CRED_FILE" "$DB_NAME" 2>"$import_err_file"; then
    err "Restore import FAILED (mysql stderr below):"
    if [ -s "$import_err_file" ]; then
      while IFS= read -r ln; do err "  $ln"; done < "$import_err_file"
    fi
    rm -f "$import_err_file"
    err "Your previous database was backed up to: $PRE_RESTORE_PATH"
    err "To recover, run: bash scripts/restore.sh \"$PRE_RESTORE_PATH\""
    exit 1
  fi
  if [ -s "$import_err_file" ]; then
    while IFS= read -r ln; do log "  (mysql) $ln"; done < "$import_err_file"
  fi
  rm -f "$import_err_file"

  # Step 7: verify table count.
  local table_count
  table_count="$(count_tables || echo 0)"
  log "Post-restore table count: $table_count (expected $EXPECTED_TABLES)"

  if [ "$table_count" -ne "$EXPECTED_TABLES" ]; then
    warn "⚠ Table count is $table_count, expected $EXPECTED_TABLES."
    warn "  The restore may have imported a partial or wrong-version schema."
    warn "  Pre-restore backup is preserved at: $PRE_RESTORE_PATH"
    err "Restore verification FAILED."
    exit 1
  fi

  ok "✓ Restore complete. $table_count tables present."
  log "── Restore complete ───────────────────────────────────"
  log "Restored from : $(basename "$backup_file")"
  log "Pre-restore   : $(basename "$PRE_RESTORE_PATH")"
  log "To UNDO this restore:"
  log "  bash scripts/restore.sh \"$PRE_RESTORE_PATH\""
  exit 0
}

main "$@"
