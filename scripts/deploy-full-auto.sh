#!/bin/bash
# ARDEN Full Automated Deployment Script
# Deploys ARDEN to Ubuntu 24.04 VPS with complete automation
# Target: rocket.id10t.social

set -e

# Configuration
DEPLOY_USER="arden"
DEPLOY_HOST="rocket.id10t.social"
DEPLOY_PATH="/home/arden/ARDEN"
BRANCH="arden-prod"
SSL_EMAIL="hal@borlandtech.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Functions
log_info() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${BLUE}▶${NC} $1" | tee -a "$LOG_FILE"
}

log_progress() {
    echo -e "${CYAN}[$1/$2]${NC} $3" | tee -a "$LOG_FILE"
}

# Banner
echo ""
echo -e "${MAGENTA}========================================${NC}"
echo -e "${MAGENTA}  ARDEN Automated Deployment${NC}"
echo -e "${MAGENTA}========================================${NC}"
echo ""
echo "Target: ${DEPLOY_HOST}"
echo "User: ${DEPLOY_USER}"
echo "Branch: ${BRANCH}"
echo "Log: ${LOG_FILE}"
echo ""

# Step 1: Pre-flight checks
log_progress "1" "8" "Pre-flight checks..."
echo ""

log_step "Checking SSH connectivity..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${DEPLOY_USER}@${DEPLOY_HOST} "echo 'SSH OK'" > /dev/null 2>&1; then
    log_warn "SSH key authentication not set up, will use password"
    if ! ssh -o ConnectTimeout=5 ${DEPLOY_USER}@${DEPLOY_HOST} "echo 'SSH OK'" > /dev/null 2>&1; then
        log_error "Cannot connect to ${DEPLOY_HOST}"
        echo "Please ensure:"
        echo "  1. Server is running"
        echo "  2. SSH is accessible"
        echo "  3. arden user exists"
        exit 1
    fi
fi
log_info "SSH connection successful"

log_step "Checking DNS resolution..."
DNS_IP=$(dig +short ${DEPLOY_HOST} | head -1)
if [ -z "$DNS_IP" ]; then
    log_error "DNS resolution failed for ${DEPLOY_HOST}"
    exit 1
fi
log_info "DNS resolves to: ${DNS_IP}"

log_step "Checking local .env file..."
if [ ! -f ".env" ]; then
    log_error "Local .env file not found!"
    echo "Please create .env file with your API keys"
    exit 1
fi
log_info "Local .env file found"

log_step "Checking git repository..."
if [ ! -d ".git" ]; then
    log_error "Not in a git repository!"
    exit 1
fi
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    log_warn "Current branch is ${CURRENT_BRANCH}, expected ${BRANCH}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
log_info "Git repository OK (branch: ${CURRENT_BRANCH})"

echo ""
log_info "Pre-flight checks complete!"
echo ""

# Step 2: VPS System Setup
log_progress "2" "8" "Installing system dependencies on VPS..."
echo ""

ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << 'ENDSSH'
set -e

echo "▶ Updating package lists..."
sudo DEBIAN_FRONTEND=noninteractive apt update -qq

echo "▶ Installing build tools and dependencies..."
sudo DEBIAN_FRONTEND=noninteractive apt install -y -qq \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-venv \
    git \
    curl \
    wget \
    nginx \
    certbot \
    python3-certbot-nginx \
    sqlite3 \
    libsqlite3-dev \
    ffmpeg

echo "✓ System dependencies installed"
ENDSSH

log_info "System dependencies installed"
echo ""

# Step 3: Install Node.js 20 LTS
log_progress "3" "8" "Installing Node.js 20 LTS..."
echo ""

ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << 'ENDSSH'
set -e

# Check if NVM is already installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "▶ Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash > /dev/null 2>&1
fi

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20
echo "▶ Installing Node.js 20 LTS..."
nvm install 20 > /dev/null 2>&1
nvm use 20 > /dev/null 2>&1
nvm alias default 20 > /dev/null 2>&1

# Configure npm to use system Python
npm config set python /usr/bin/python3

echo "✓ Node.js $(node -v) installed"
echo "✓ npm $(npm -v) installed"
ENDSSH

log_info "Node.js 20 LTS installed"
echo ""

# Step 4: Install PM2
log_progress "4" "8" "Installing PM2 process manager..."
echo ""

ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << 'ENDSSH'
set -e

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "▶ Installing PM2..."
    npm install -g pm2 > /dev/null 2>&1
    echo "✓ PM2 installed"
else
    echo "✓ PM2 already installed ($(pm2 -v))"
fi
ENDSSH

log_info "PM2 installed"
echo ""

# Step 5: Clone repository and setup
log_progress "5" "8" "Setting up ARDEN repository..."
echo ""

ssh ${DEPLOY_USER}@${DEPLOY_HOST} "bash -s" << ENDSSH
set -e

# Create directories
mkdir -p ~/Notes ~/Documents

# Clone or update repository
if [ ! -d "${DEPLOY_PATH}" ]; then
    echo "▶ Cloning repository..."
    cd ~
    git clone https://github.com/infurno/ARDEN.git > /dev/null 2>&1
    cd ARDEN
    git checkout ${BRANCH} > /dev/null 2>&1
    echo "✓ Repository cloned"
else
    echo "▶ Updating existing repository..."
    cd ${DEPLOY_PATH}
    
    # Backup .env if exists
    if [ -f .env ]; then
        cp .env .env.backup.\$(date +%Y%m%d-%H%M%S)
        echo "✓ Backed up existing .env"
    fi
    
    git fetch origin > /dev/null 2>&1
    git checkout ${BRANCH} > /dev/null 2>&1
    git pull origin ${BRANCH} > /dev/null 2>&1
    echo "✓ Repository updated"
fi

# Create log directory
sudo mkdir -p /var/log/arden
sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} /var/log/arden
echo "✓ Log directory created"

# Create voice directories
mkdir -p ${DEPLOY_PATH}/voice/recordings ${DEPLOY_PATH}/voice/responses
echo "✓ Voice directories created"
ENDSSH

log_info "Repository setup complete"
echo ""

# Step 6: Transfer .env securely
log_progress "6" "8" "Transferring .env configuration..."
echo ""

log_step "Copying .env to VPS..."
scp -q .env ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/.env

ssh ${DEPLOY_USER}@${DEPLOY_HOST} "bash -s" << ENDSSH
chmod 600 ${DEPLOY_PATH}/.env
echo "✓ .env permissions set to 600"
ENDSSH

log_info ".env transferred and secured"
echo ""

# Step 7: Install npm dependencies
log_progress "7" "8" "Installing npm dependencies..."
echo ""

ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << ENDSSH
set -e

# Load NVM
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"

cd ${DEPLOY_PATH}/api

# Configure npm for Python 3.13
export npm_config_python=/usr/bin/python3

echo "▶ Installing npm packages..."
npm install --omit=dev > /dev/null 2>&1

# Verify better-sqlite3 installed
if npm list better-sqlite3 > /dev/null 2>&1; then
    echo "✓ better-sqlite3 installed successfully"
else
    echo "✗ better-sqlite3 installation failed!"
    exit 1
fi

echo "✓ npm dependencies installed"
ENDSSH

log_info "npm dependencies installed"
echo ""

# Step 8: Configure Nginx and SSL
log_progress "8" "8" "Configuring Nginx and SSL..."
echo ""

ssh ${DEPLOY_USER}@${DEPLOY_HOST} "bash -s" << ENDSSH
set -e

# Copy nginx config
echo "▶ Configuring Nginx..."
sudo cp ${DEPLOY_PATH}/config/nginx-rocket.conf /etc/nginx/sites-available/arden

# Enable site
sudo ln -sf /etc/nginx/sites-available/arden /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
if sudo nginx -t > /dev/null 2>&1; then
    echo "✓ Nginx configuration valid"
else
    echo "✗ Nginx configuration error!"
    exit 1
fi

# Restart nginx
sudo systemctl restart nginx
echo "✓ Nginx restarted"

# Configure firewall
echo "▶ Configuring firewall..."
sudo ufw --force enable > /dev/null 2>&1
sudo ufw allow 22/tcp > /dev/null 2>&1
sudo ufw allow 80/tcp > /dev/null 2>&1
sudo ufw allow 443/tcp > /dev/null 2>&1
echo "✓ Firewall configured"

# Get SSL certificate
echo "▶ Obtaining SSL certificate..."
sudo certbot --nginx -d ${DEPLOY_HOST} --non-interactive --agree-tos --email ${SSL_EMAIL} --redirect > /dev/null 2>&1 || {
    echo "⚠ SSL certificate request failed (may already exist or DNS issue)"
    echo "  You can manually run: sudo certbot --nginx -d ${DEPLOY_HOST}"
}
ENDSSH

log_info "Nginx and SSL configured"
echo ""

# Step 9: Setup automated backups
log_step "Setting up automated backups..."
ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << 'ENDSSH'
set -e

# Create backup directory
mkdir -p ~/backups

# Create backup script
cat > ~/backups/daily-backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
# ARDEN Daily Backup Script

BACKUP_DIR="$HOME/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup .env
cp ~/ARDEN/.env "$BACKUP_DIR/.env" 2>/dev/null || true

# Backup SQLite databases
cp ~/ARDEN/api/*.db "$BACKUP_DIR/" 2>/dev/null || true
cp ~/ARDEN/api/*.sqlite "$BACKUP_DIR/" 2>/dev/null || true
cp ~/ARDEN/api/*.sqlite3 "$BACKUP_DIR/" 2>/dev/null || true

# Backup PM2 config
pm2 save > /dev/null 2>&1 || true
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2-dump.pm2" 2>/dev/null || true

# Compress backup
cd ~/backups
tar -czf "$(date +%Y-%m-%d).tar.gz" "$(date +%Y-%m-%d)" 2>/dev/null || true
rm -rf "$(date +%Y-%m-%d)"

# Delete backups older than 7 days
find ~/backups -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo "Backup completed: $(date)"
BACKUP_SCRIPT

chmod +x ~/backups/daily-backup.sh

# Add to cron (daily at 2 AM)
(crontab -l 2>/dev/null | grep -v daily-backup.sh; echo "0 2 * * * $HOME/backups/daily-backup.sh >> $HOME/backups/backup.log 2>&1") | crontab -

echo "✓ Automated backups configured (daily at 2 AM)"

# Run initial backup
~/backups/daily-backup.sh
echo "✓ Initial backup completed"
ENDSSH

log_info "Automated backups configured"
echo ""

# Step 10: Start services with PM2
log_step "Starting PM2 services..."
ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << ENDSSH
set -e

# Load NVM
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"

cd ${DEPLOY_PATH}

# Stop any existing services
pm2 delete all > /dev/null 2>&1 || true

# Start services
echo "▶ Starting PM2 services..."
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save

# Configure PM2 startup
pm2 startup > /dev/null 2>&1 || {
    echo "⚠ PM2 startup configuration may require manual setup"
    echo "  Run: pm2 startup"
}

echo ""
echo "✓ PM2 services started"
echo ""
pm2 status
ENDSSH

log_info "PM2 services started"
echo ""

# Step 11: Health checks
log_step "Running health checks..."
echo ""

sleep 5  # Give services time to start

ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << 'ENDSSH'
set -e

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "System Checks:"
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo "  PM2: $(pm2 -v)"
echo ""

echo "Service Checks:"
cd ~/ARDEN
pm2 status | grep -E "online|errored" || true
echo ""

echo "Network Checks:"
if systemctl is-active --quiet nginx; then
    echo "  Nginx: ✓ Running"
else
    echo "  Nginx: ✗ Not running"
fi

if sudo ufw status | grep -q "Status: active"; then
    echo "  Firewall: ✓ Active"
else
    echo "  Firewall: ✗ Inactive"
fi

echo ""
echo "Checking logs for errors..."
pm2 logs --nostream --lines 20 | grep -i error || echo "  No recent errors found"
ENDSSH

echo ""
log_info "Health checks complete"
echo ""

# Final summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services:"
echo "  • arden-bot (Telegram Bot)"
echo "  • arden-web (Web Interface)"
echo ""
echo "Access Points:"
echo "  • Web Interface: https://${DEPLOY_HOST}"
echo "  • Telegram Bot: Check your bot on Telegram"
echo ""
echo "Management Commands:"
echo "  • SSH: ssh ${DEPLOY_USER}@${DEPLOY_HOST}"
echo "  • Status: ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'pm2 status'"
echo "  • Logs: ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'pm2 logs'"
echo "  • Restart: ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'pm2 restart all'"
echo ""
echo "Backups:"
echo "  • Daily at 2 AM to ~/backups/"
echo "  • 7-day retention"
echo ""
echo "Next Steps:"
echo "  1. Test Telegram bot (send /start to your bot)"
echo "  2. Access web interface at https://${DEPLOY_HOST}"
echo "  3. Configure Telegram user restrictions (optional):"
echo "     ssh ${DEPLOY_USER}@${DEPLOY_HOST}"
echo "     nano ~/ARDEN/config/arden.production.json"
echo "     # Add your Telegram user ID to allowed_users array"
echo "     pm2 restart arden-bot"
echo ""
echo "Deployment log saved to: ${LOG_FILE}"
echo ""
