#!/bin/bash

# ARDEN Backup Script
# Backs up critical configuration and data files

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="arden-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo "========================================="
echo "ARDEN Backup Script"
echo "========================================="
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}Creating backup: ${BACKUP_NAME}${NC}"
echo ""

# Create temporary directory for backup
TEMP_BACKUP="/tmp/${BACKUP_NAME}"
mkdir -p "$TEMP_BACKUP"

echo "Backing up critical files..."

# Backup .env file (contains sensitive data)
if [ -f "${PROJECT_ROOT}/.env" ]; then
    cp "${PROJECT_ROOT}/.env" "${TEMP_BACKUP}/.env"
    echo "✓ .env"
fi

# Backup configuration
if [ -d "${PROJECT_ROOT}/config" ]; then
    cp -r "${PROJECT_ROOT}/config" "${TEMP_BACKUP}/"
    echo "✓ config/"
fi

# Backup history/sessions
if [ -d "${PROJECT_ROOT}/history" ]; then
    cp -r "${PROJECT_ROOT}/history" "${TEMP_BACKUP}/"
    echo "✓ history/"
fi

# Backup skills (custom scripts and data)
if [ -d "${PROJECT_ROOT}/skills" ]; then
    cp -r "${PROJECT_ROOT}/skills" "${TEMP_BACKUP}/"
    echo "✓ skills/"
fi

# Backup PM2 ecosystem config
if [ -f "${PROJECT_ROOT}/ecosystem.config.js" ]; then
    cp "${PROJECT_ROOT}/ecosystem.config.js" "${TEMP_BACKUP}/"
    echo "✓ ecosystem.config.js"
fi

# Create backup metadata
cat > "${TEMP_BACKUP}/BACKUP_INFO.txt" << EOL
ARDEN Backup
============
Created: $(date)
Hostname: $(hostname)
User: $(whoami)
ARDEN Path: ${PROJECT_ROOT}

Contents:
- .env (environment configuration)
- config/ (application configuration)
- history/ (session logs)
- skills/ (custom skills and data)
- ecosystem.config.js (PM2 configuration)

Restore Instructions:
1. Extract this archive to your ARDEN directory
2. Review and update .env if needed
3. Restart the bot: pm2 restart arden-bot
EOL

# Create compressed archive
echo ""
echo "Compressing backup..."
cd /tmp
tar -czf "${BACKUP_PATH}.tar.gz" "${BACKUP_NAME}"

# Cleanup temporary directory
rm -rf "$TEMP_BACKUP"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Backup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Backup file: ${BACKUP_PATH}.tar.gz"
echo "Size: ${BACKUP_SIZE}"
echo ""

# List recent backups
echo "Recent backups:"
ls -lh "${BACKUP_DIR}" | tail -n 6

echo ""
echo "To restore this backup:"
echo "  cd ${PROJECT_ROOT}"
echo "  tar -xzf ${BACKUP_PATH}.tar.gz"
echo "  cp -r ${BACKUP_NAME}/* ."
echo "  pm2 restart arden-bot"
echo ""

# Cleanup old backups (keep last 10)
echo -e "${YELLOW}Cleaning up old backups (keeping last 10)...${NC}"
cd "$BACKUP_DIR"
ls -t arden-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
echo "Done!"
echo ""

# Offer to download backup
if [ -n "$SSH_CONNECTION" ]; then
    echo "To download this backup to your local machine:"
    echo "  scp $(whoami)@$(hostname):${BACKUP_PATH}.tar.gz ./"
    echo ""
fi
