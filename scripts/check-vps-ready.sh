#!/bin/bash
# VPS Readiness Check Script
# Run this on your VPS to verify it's ready for ARDEN deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ARDEN VPS Readiness Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
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

# Check 1: Operating System
echo "Checking operating system..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "  OS: $NAME $VERSION"
    if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
        check_pass "Supported OS detected ($NAME)"
    else
        check_warn "Untested OS ($NAME). Ubuntu/Debian recommended."
    fi
else
    check_fail "Cannot detect OS"
fi
echo ""

# Check 2: User
echo "Checking current user..."
if [ "$USER" == "arden" ]; then
    check_pass "Running as 'arden' user"
elif [ "$USER" == "root" ]; then
    check_warn "Running as root. Consider creating 'arden' user."
else
    check_warn "Running as '$USER'. Recommended to use 'arden' user."
fi
echo ""

# Check 3: System packages
echo "Checking system packages..."

packages=(
    "build-essential"
    "git"
    "curl"
    "wget"
    "nginx"
    "certbot"
    "python3"
    "python3-pip"
    "sqlite3"
    "ffmpeg"
)

for pkg in "${packages[@]}"; do
    if command -v "$pkg" &> /dev/null || dpkg -l | grep -q "^ii  $pkg "; then
        check_pass "$pkg installed"
    else
        check_fail "$pkg not installed"
    fi
done
echo ""

# Check 4: Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed: $NODE_VERSION"
    
    # Check version is 18+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        check_pass "Node.js version is 18 or higher"
    else
        check_fail "Node.js version should be 18 or higher (current: $NODE_VERSION)"
    fi
else
    check_fail "Node.js not installed"
fi
echo ""

# Check 5: npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed: v$NPM_VERSION"
    
    # Check npm Python config
    NPM_PYTHON=$(npm config get python 2>/dev/null || echo "not set")
    if [ "$NPM_PYTHON" != "not set" ]; then
        check_pass "npm configured to use Python: $NPM_PYTHON"
    else
        check_warn "npm Python not configured. Run: npm config set python /usr/bin/python3"
    fi
else
    check_fail "npm not installed"
fi
echo ""

# Check 6: PM2
echo "Checking PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    check_pass "PM2 installed: v$PM2_VERSION"
else
    check_fail "PM2 not installed. Run: npm install -g pm2"
fi
echo ""

# Check 7: Disk space
echo "Checking disk space..."
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')
DISK_AVAIL_GB=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
echo "  Available: $DISK_AVAIL"
if [ "$DISK_AVAIL_GB" -ge 10 ]; then
    check_pass "Sufficient disk space (${DISK_AVAIL})"
else
    check_warn "Low disk space (${DISK_AVAIL}). Recommended: 10GB+"
fi
echo ""

# Check 8: Memory
echo "Checking memory..."
TOTAL_MEM=$(free -m | awk 'NR==2 {print $2}')
echo "  Total: ${TOTAL_MEM}MB"
if [ "$TOTAL_MEM" -ge 2048 ]; then
    check_pass "Memory: ${TOTAL_MEM}MB (recommended)"
elif [ "$TOTAL_MEM" -ge 1024 ]; then
    check_warn "Memory: ${TOTAL_MEM}MB (minimum met, 2GB recommended)"
else
    check_fail "Insufficient memory: ${TOTAL_MEM}MB (minimum: 1GB)"
fi
echo ""

# Check 9: Ports
echo "Checking ports..."
PORTS=(22 80 443)
for port in "${PORTS[@]}"; do
    if sudo netstat -tuln 2>/dev/null | grep -q ":$port "; then
        if [ "$port" -eq 22 ]; then
            check_pass "Port $port (SSH) is listening"
        elif [ "$port" -eq 80 ] || [ "$port" -eq 443 ]; then
            check_warn "Port $port already in use (may need nginx restart)"
        fi
    else
        if [ "$port" -eq 22 ]; then
            check_warn "Port $port (SSH) not detected"
        else
            check_pass "Port $port available"
        fi
    fi
done
echo ""

# Check 10: Firewall
echo "Checking firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -1)
    echo "  UFW: $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "active"; then
        check_pass "UFW firewall is active"
        
        # Check if required ports are allowed
        for port in 22 80 443; do
            if sudo ufw status | grep -q "$port"; then
                check_pass "Port $port allowed in firewall"
            else
                check_warn "Port $port not allowed in firewall"
            fi
        done
    else
        check_warn "UFW firewall is inactive"
    fi
else
    check_warn "UFW not installed"
fi
echo ""

# Check 11: Log directory
echo "Checking log directory..."
if [ -d "/var/log/arden" ]; then
    if [ -w "/var/log/arden" ]; then
        check_pass "/var/log/arden exists and is writable"
    else
        check_fail "/var/log/arden exists but not writable"
    fi
else
    check_warn "/var/log/arden does not exist (will be created during setup)"
fi
echo ""

# Check 12: ARDEN directory
echo "Checking ARDEN installation..."
if [ -d "$HOME/ARDEN" ]; then
    check_pass "ARDEN directory exists: $HOME/ARDEN"
    
    if [ -d "$HOME/ARDEN/.git" ]; then
        check_pass "Git repository detected"
        cd "$HOME/ARDEN"
        BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
        echo "  Current branch: $BRANCH"
    else
        check_warn "Not a git repository"
    fi
    
    if [ -f "$HOME/ARDEN/.env" ]; then
        check_pass ".env file exists"
    else
        check_warn ".env file not found (needs to be created)"
    fi
    
    if [ -d "$HOME/ARDEN/api/node_modules" ]; then
        check_pass "node_modules directory exists"
    else
        check_warn "node_modules not found (run npm install)"
    fi
else
    check_warn "ARDEN directory not found: $HOME/ARDEN"
fi
echo ""

# Check 13: Nginx configuration
echo "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/arden" ]; then
    check_pass "Nginx config exists: /etc/nginx/sites-available/arden"
    
    if [ -L "/etc/nginx/sites-enabled/arden" ]; then
        check_pass "Nginx config enabled"
    else
        check_warn "Nginx config not enabled"
    fi
else
    check_warn "Nginx config not found (will be created during setup)"
fi

if command -v nginx &> /dev/null; then
    if sudo nginx -t 2>/dev/null; then
        check_pass "Nginx configuration is valid"
    else
        check_fail "Nginx configuration has errors"
    fi
fi
echo ""

# Check 14: SSL certificate
echo "Checking SSL certificate..."
SSL_DIR="/etc/letsencrypt/live/rocket.id10t.social"
if [ -d "$SSL_DIR" ]; then
    check_pass "SSL certificate exists for rocket.id10t.social"
    
    # Check expiration
    if [ -f "$SSL_DIR/cert.pem" ]; then
        EXPIRY=$(sudo openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" 2>/dev/null | cut -d= -f2)
        echo "  Expires: $EXPIRY"
    fi
else
    check_warn "SSL certificate not found (run: sudo certbot --nginx -d rocket.id10t.social)"
fi
echo ""

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${RED}Failed:${NC}   $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ System is ready for ARDEN deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure .env file is configured with API keys"
    echo "  2. Run: cd ~/ARDEN/api && npm install --production"
    echo "  3. Run: pm2 start ~/ARDEN/ecosystem.config.js"
    echo ""
else
    echo -e "${RED}✗ System is NOT ready. Please fix the failed checks.${NC}"
    echo ""
    echo "To install missing dependencies, run:"
    echo "  curl -fsSL https://raw.githubusercontent.com/yourusername/ARDEN/arden-prod/scripts/setup-vps.sh | bash"
    echo ""
fi

exit $FAILED
