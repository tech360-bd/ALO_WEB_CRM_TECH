#!/bin/bash
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
