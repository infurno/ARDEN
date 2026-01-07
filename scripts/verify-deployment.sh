#!/bin/bash
# ARDEN Deployment Verification Script
# Comprehensive health checks after deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ARDEN Deployment Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# System Checks
echo "System Checks:"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    check_pass "Node.js version $(node -v)"
else
    check_fail "Node.js version too old: $(node -v) (need v20+)"
fi

if command -v pm2 &> /dev/null; then
    check_pass "PM2 installed ($(pm2 -v))"
else
    check_fail "PM2 not installed"
fi

if command -v nginx &> /dev/null; then
    check_pass "Nginx installed"
else
    check_fail "Nginx not installed"
fi

# Disk space
DISK_FREE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$DISK_FREE" -ge 5 ]; then
    check_pass "Disk space: ${DISK_FREE}GB available"
else
    check_warn "Low disk space: ${DISK_FREE}GB"
fi

# Memory
FREE_MEM=$(free -m | awk 'NR==2 {print $7}')
if [ "$FREE_MEM" -ge 512 ]; then
    check_pass "Memory: ${FREE_MEM}MB available"
else
    check_warn "Low memory: ${FREE_MEM}MB"
fi

echo ""

# Application Checks
echo "Application Checks:"
if [ -d "$HOME/ARDEN" ]; then
    check_pass "ARDEN directory exists"
else
    check_fail "ARDEN directory not found"
fi

if [ -f "$HOME/ARDEN/.env" ]; then
    ENV_PERMS=$(stat -c %a "$HOME/ARDEN/.env" 2>/dev/null || stat -f %OLp "$HOME/ARDEN/.env" 2>/dev/null)
    if [ "$ENV_PERMS" = "600" ]; then
        check_pass ".env file with correct permissions (600)"
    else
        check_warn ".env permissions: $ENV_PERMS (should be 600)"
    fi
else
    check_fail ".env file not found"
fi

if [ -d "$HOME/ARDEN/api/node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_fail "node_modules not found"
fi

if [ -d "$HOME/ARDEN/api/node_modules/better-sqlite3" ]; then
    check_pass "better-sqlite3 installed"
else
    check_fail "better-sqlite3 not installed"
fi

echo ""

# Service Checks
echo "Service Checks:"
PM2_STATUS=$(pm2 jlist 2>/dev/null || echo "[]")

if echo "$PM2_STATUS" | grep -q "arden-bot"; then
    BOT_STATUS=$(echo "$PM2_STATUS" | jq -r '.[] | select(.name=="arden-bot") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$BOT_STATUS" = "online" ]; then
        check_pass "arden-bot is online"
    else
        check_fail "arden-bot is $BOT_STATUS"
    fi
else
    check_fail "arden-bot not found in PM2"
fi

if echo "$PM2_STATUS" | grep -q "arden-web"; then
    WEB_STATUS=$(echo "$PM2_STATUS" | jq -r '.[] | select(.name=="arden-web") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$WEB_STATUS" = "online" ]; then
        check_pass "arden-web is online"
    else
        check_fail "arden-web is $WEB_STATUS"
    fi
else
    check_fail "arden-web not found in PM2"
fi

echo ""

# Network Checks
echo "Network Checks:"
if systemctl is-active --quiet nginx 2>/dev/null; then
    check_pass "Nginx is running"
else
    check_fail "Nginx is not running"
fi

if sudo nginx -t > /dev/null 2>&1; then
    check_pass "Nginx configuration valid"
else
    check_fail "Nginx configuration has errors"
fi

if sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    check_pass "Firewall (UFW) is active"
else
    check_warn "Firewall is not active"
fi

# Check SSL certificate
if [ -d "/etc/letsencrypt/live/rocket.id10t.social" ]; then
    check_pass "SSL certificate exists"
else
    check_warn "SSL certificate not found"
fi

echo ""

# Backup Checks
echo "Backup Checks:"
if [ -d "$HOME/backups" ]; then
    check_pass "Backup directory exists"
    
    if [ -f "$HOME/backups/daily-backup.sh" ]; then
        check_pass "Backup script installed"
    else
        check_warn "Backup script not found"
    fi
    
    if crontab -l 2>/dev/null | grep -q "daily-backup.sh"; then
        check_pass "Backup cron job configured"
    else
        check_warn "Backup cron job not found"
    fi
else
    check_warn "Backup directory not found"
fi

echo ""

# Log Checks
echo "Log Checks:"
if [ -d "/var/log/arden" ]; then
    check_pass "Log directory exists"
else
    check_warn "Log directory not found"
fi

# Check recent logs for errors
if pm2 logs --nostream --lines 50 2>/dev/null | grep -i "error" | grep -v "0 error" > /dev/null; then
    check_warn "Recent errors found in PM2 logs"
else
    check_pass "No recent errors in logs"
fi

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed:   $PASSED${NC}"
echo -e "${RED}Failed:   $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment verification PASSED!${NC}"
    echo ""
    echo "Your ARDEN installation is ready to use."
    echo ""
    echo "Access your services:"
    echo "  • Web: https://rocket.id10t.social"
    echo "  • Bot: Send /start to your Telegram bot"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Deployment verification FAILED${NC}"
    echo ""
    echo "Please review the failed checks above and fix the issues."
    echo ""
    exit 1
fi
