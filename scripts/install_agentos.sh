#!/bin/bash
# DEPLOYMENT OWNERSHIP QUARANTINE — no environment override is supported.
# GitHub Actions is CI-only; main eligibility never authorizes this legacy path.
_alo_branch="$(git -C "$(dirname "$0")" branch --show-current 2>/dev/null)" || _alo_branch=""
if [ "$_alo_branch" != "main" ]; then
  echo "BLOCKED: production operations require the main branch; current branch is unauthorized or unknown." >&2
  exit 1
fi
echo "DISABLED: legacy deployment/recovery is not an approved Hostinger production mechanism. No changes performed." >&2
exit 1
# Historical implementation below is unreachable; preserved as audit evidence.
# ALO Education AgentOS Installer Script
set -e

echo "===================================================="
echo "🚀 INSTALLING ALO AGENTOS 2000+ AI OPERATING SYSTEM"
echo "===================================================="

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

echo "[1/4] Seeding 2000 Agents & SQLite Database Schema..."
python3 scripts/seed_agents.py

echo "[2/4] Generating 2000 OpenClaw-Style Private Skills..."
python3 scripts/generate_1020_skills.py

echo "[3/4] Validating Private Skill Integrity..."
python3 -c "from backend.openclaw_adapter import openclaw_adapter; print('Loaded skills:', len(openclaw_adapter.list_private_skills()))"

echo "[4/4] Running Full System Smoke Test Suite..."
python3 scripts/smoke_test.py

echo "===================================================="
echo "✓ ALO AGENTOS INSTALLED AND VERIFIED SUCCESSFULLY!"
echo "===================================================="
