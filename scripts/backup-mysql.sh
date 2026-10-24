#!/usr/bin/env bash
# Private MySQL logical backup. Uses the application's DATABASE_URL, or explicit
# DB_DATABASE/DB_USERNAME/DB_HOST/DB_PORT/DB_PASSWORD for legacy installations.
# No production database is selected implicitly. Run only on an authorized host.
set -Eeuo pipefail
umask 077

for command in node mysqldump gzip sha256sum mktemp; do
  command -v "$command" >/dev/null 2>&1 || { echo "[Backup] Required command unavailable: $command" >&2; exit 1; }
done
BACKUP_DIR="${BACKUP_DIR:-/home/aloeduca/alo-web-crm-shared/backups}"
mkdir -p -- "$BACKUP_DIR"
chmod 700 -- "$BACKUP_DIR"
CREDENTIALS_FILE="$(mktemp "$BACKUP_DIR/.mysql-client.XXXXXX")"
PARTIAL_FILE=''
cleanup() {
  rm -f -- "$CREDENTIALS_FILE"
  if [ -n "$PARTIAL_FILE" ]; then rm -f -- "$PARTIAL_FILE"; fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# The password is stored only in a private temporary defaults file. It is never
# passed on the command line, emitted to stdout or embedded in a source file.
DB_NAME="$(node - "$CREDENTIALS_FILE" <<'NODE'
const fs = require('node:fs');
try {
  let database, user, password, host, port;
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    if (url.protocol !== 'mysql:') throw new Error();
    database = decodeURIComponent(url.pathname.slice(1));
    user = decodeURIComponent(url.username); password = decodeURIComponent(url.password);
    host = url.hostname.replace(/^\[|\]$/g, ''); port = url.port || '3306';
  } else {
    database = process.env.DB_DATABASE || process.env.DB_NAME;
    user = process.env.DB_USERNAME || process.env.DB_USER;
    password = process.env.DB_PASSWORD || ''; host = process.env.DB_HOST || 'localhost'; port = process.env.DB_PORT || '3306';
  }
  if (!database || !/^[A-Za-z0-9_][A-Za-z0-9_$.-]{0,63}$/.test(database) || !user || !host || !/^\d+$/.test(port) || +port < 1 || +port > 65535) throw new Error();
  const quoted = value => {
    if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error();
    return '"' + value.replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"';
  };
  const values = { host, port, user, password };
  const ssl = process.env.DB_SSL_MODE;
  if (ssl) { if (!['DISABLED','PREFERRED','REQUIRED','VERIFY_CA','VERIFY_IDENTITY'].includes(ssl)) throw new Error(); values['ssl-mode'] = ssl; }
  fs.writeFileSync(process.argv[2], '[client]\n' + Object.entries(values).map(([key,value]) => `${key}=${quoted(value)}`).join('\n') + '\n', { mode: 0o600 });
  process.stdout.write(database);
} catch {
  console.error('[Backup] Invalid or missing database configuration. No backup was attempted.');
  process.exit(1);
}
NODE
)"

TIMESTAMP="$(date -u +'%Y%m%dT%H%M%SZ')"
PARTIAL_FILE="$(mktemp "$BACKUP_DIR/.${DB_NAME}_${TIMESTAMP}.XXXXXX.partial")"
# --defaults-extra-file must be the first argument. --single-transaction provides
# a consistent InnoDB snapshot; nontransactional tables require a host-specific
# backup policy. A pipeline failure never becomes a successful gzip-only result.
mysqldump --defaults-extra-file="$CREDENTIALS_FILE" --single-transaction --quick --routines --events --triggers --no-tablespaces -- "$DB_NAME" | gzip -c > "$PARTIAL_FILE"
gzip -t -- "$PARTIAL_FILE"
UNCOMPRESSED_BYTES="$(gzip -dc -- "$PARTIAL_FILE" | wc -c)"
if [ "$UNCOMPRESSED_BYTES" -eq 0 ]; then echo '[Backup] Empty SQL dump rejected.' >&2; exit 1; fi
ARCHIVE_BASENAME="${PARTIAL_FILE##*/}"
BACKUP_FILE="$BACKUP_DIR/${ARCHIVE_BASENAME#.}"
BACKUP_FILE="${BACKUP_FILE%.partial}.sql.gz"
mv -- "$PARTIAL_FILE" "$BACKUP_FILE"
PARTIAL_FILE=''
sha256sum -- "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
chmod 600 -- "$BACKUP_FILE" "$BACKUP_FILE.sha256"
sha256sum --check --status "$BACKUP_FILE.sha256"
printf '[Backup] Created gzip-verified, checksum-verified SQL archive: %s\n' "$BACKUP_FILE"
printf '[Backup] Database restoration has not been tested by this command.\n'
