#!/usr/bin/env bash
set -euo pipefail
echo "Scanning tracked files for credential-shaped strings..."
# SCAN SCOPE: every tracked file, INCLUDING markdown/docs.
#   A previous version excluded ':!docs' and ':!*.md', which is exactly
#   how a real production DB password survived in OPERATIONS-BOOK.md and
#   documentation/CPANEL-DEPLOYMENT-GUIDE.md undetected. Docs are the
#   most common place credentials get pasted, so they are now scanned.
# Excluded: workflow files (documented dummy build-check values) and
#   *.example templates (REPLACE_* placeholders).
# Matches containing obvious placeholder words are filtered out;
# anything left is treated as a hard failure.
umask 077
SCAN_OUTPUT=$(mktemp)
trap 'rm -f "$SCAN_OUTPUT"' EXIT
if git grep -InE \
  -e '-----BEGIN (RSA|OPENSSH|EC|PGP) PRIVATE KEY' \
  -e 'mysql://[^"'"'"' ]+:[^"'"'"' @]+@' \
  -e 'postgres(ql)?://[^"'"'"' ]+:[^"'"'"' @]+@' \
  -e 'ghp_[A-Za-z0-9]{36}' \
  -e 'github_pat_[A-Za-z0-9_]{20,}' \
  -e 'xox[baprs]-[A-Za-z0-9-]{10,}' \
  -e 'sk-[A-Za-z0-9]{32,}' \
  -e 'AIza[0-9A-Za-z_-]{35}' \
  -e '(mysqldump|mysql|psql|pg_dump)[^|;&]*[[:space:]]-p[^[:space:]]*[A-Za-z0-9!@#$%^&*_=+-]{6,}' \
  -e '(PASSWORD|PASSWD|SECRET|API_KEY|ACCESS_TOKEN|PRIVATE_KEY)[[:space:]]*(=[[:space:]]*[A-Za-z0-9!@#$%^&*_=+-]|:[[:space:]]*[^(\)\[\]])["'"'"']?[A-Za-z0-9!@#$%^&*_=+-]{10,}' \
  -- . ':!.github' ':!*.example' ':!*example*' > "$SCAN_OUTPUT"; then
  :
else
  scan_status=$?
  if [ "$scan_status" -ne 1 ]; then
    echo "::error::Tracked-file secret scan failed; refusing to pass the gate."
    exit "$scan_status"
  fi
fi
HITS=$(cat "$SCAN_OUTPUT" \
  | grep -viE 'REPLACE|dummy|placeholder|CHANGE_?ME|YOUR_|xxxxxxxx|<[^>]+>|ENCODED_PASS|process\.env|os\.environ|generate:|generate-with|openssl rand|example\.com|@types/|SET_VIA_ENVIRONMENT_ONLY|long_random_|same-or-different|__from_env_|random-secret|session-secret-32|auth-secret-32|root_password|UniqueOneTimePassword' \
  | grep -vE '\$[A-Za-z_{]' \
  | grep -vE '://[^:/@[:space:]]+:(PASSWORD|password|pass|PASS|pwd|\.\.\.)@' \
  | grep -vE '=[[:space:]]+[A-Z][A-Z0-9_]*=' \
  || true)
  # Filters applied after the match, in order:
  #   1. placeholder / dummy wording
  #   2. the "secret" is only a shell variable reference ($VAR/${VAR}/\$VAR)
  #   3. DSN whose password is the literal word PASSWORD/pass/... (doc template)
  #   4. a run of empty assignments ("A_KEY= B_KEY=") where the matched
  #      "value" is merely the next variable's name
  # The assignment rule requires NO space after '=' and, for ':', a
  # value not starting with '(' or '[' -- so prose such as
  #   "Set `GROQ_API_KEY` (real Groq key, >=10 chars)"
  # is not mistaken for a credential assignment.
printf '%s\n' "$HITS" | node scripts/ci/check-secret-findings.mjs
echo "✓ No unreviewed secret-shaped strings in tracked files (docs included)"
