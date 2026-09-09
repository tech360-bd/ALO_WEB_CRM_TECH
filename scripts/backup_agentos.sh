#!/bin/bash
# Backup script for AgentOS Database & Memory
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$BASE_DIR/storage/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$BACKUP_DIR"

if [ -f "$BASE_DIR/storage/agentos.db" ]; then
  cp "$BASE_DIR/storage/agentos.db" "$BACKUP_DIR/agentos_backup_$TIMESTAMP.db"
  echo "✓ Database backed up to $BACKUP_DIR/agentos_backup_$TIMESTAMP.db"
fi
