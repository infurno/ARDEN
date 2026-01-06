#!/bin/bash
# ARDEN Deployment Script for rocket.id10t.social
# Automated deployment to Hetzner VPS

set -e

echo "🚀 ARDEN Deployment Script for rocket.id10t.social"
echo "=================================================="
echo ""

# Configuration
DEPLOY_USER="arden"
DEPLOY_HOST="rocket.id10t.social"
DEPLOY_PATH="/home/arden/ARDEN"
BRANCH="arden-prod"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we can connect to the server
echo "Checking connection to ${DEPLOY_HOST}..."
if ! ssh -o ConnectTimeout=5 ${DEPLOY_USER}@${DEPLOY_HOST} "echo 'Connection successful'" > /dev/null 2>&1; then
    log_error "Cannot connect to ${DEPLOY_HOST}"
    echo "Please ensure:"
    echo "  1. SSH key is set up"
    echo "  2. Server is running"
    echo "  3. DNS is configured correctly"
    exit 1
fi
log_info "Connected to ${DEPLOY_HOST}"

# Deploy
echo ""
echo "Starting deployment..."
echo ""

# Create deployment script on remote server
ssh ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
set -e

echo "📦 Preparing deployment..."

# Navigate to project directory
cd /home/arden/ARDEN

# Backup current .env if it exists
if [ -f .env ]; then
    echo "Backing up current .env..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Pull latest changes
echo "Fetching latest changes from git..."
git fetch origin

# Checkout production branch
echo "Switching to arden-prod branch..."
git checkout arden-prod
git pull origin arden-prod

# Install/update dependencies
echo "Installing dependencies..."
cd api
npm install --production
cd ..

# Create log directory if it doesn't exist
echo "Setting up log directory..."
sudo mkdir -p /var/log/arden
sudo chown -R arden:arden /var/log/arden

# Restart services with PM2
echo "Restarting services..."
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

echo "✓ Deployment complete!"
echo ""
echo "Service status:"
pm2 status

echo ""
echo "To view logs:"
echo "  pm2 logs arden-bot"
echo "  pm2 logs arden-web"
echo ""
echo "To view all logs:"
echo "  pm2 logs"

ENDSSH

log_info "Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. SSH to server: ssh ${DEPLOY_USER}@${DEPLOY_HOST}"
echo "  2. Configure .env with your API keys"
echo "  3. Restart services: pm2 restart all"
echo ""
echo "Monitor services:"
echo "  pm2 status"
echo "  pm2 logs"
