#!/bin/bash
# VPS Setup Script for ARDEN on rocket.id10t.social
# Run this once on the VPS to install all dependencies

set -e

echo "🚀 ARDEN VPS Setup Script"
echo "========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as arden user
if [ "$USER" != "arden" ]; then
    log_error "This script should be run as the 'arden' user"
    echo "Run: sudo su - arden"
    exit 1
fi

echo "Installing system dependencies..."

# Install build tools and dependencies
sudo apt update
sudo apt install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-distutils \
    git \
    curl \
    wget \
    nginx \
    certbot \
    python3-certbot-nginx \
    sqlite3 \
    libsqlite3-dev

log_info "System dependencies installed"

# Install Node.js via NVM if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js via NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    log_info "Node.js installed"
else
    log_info "Node.js already installed: $(node -v)"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
    log_info "PM2 installed"
else
    log_info "PM2 already installed: $(pm2 -v)"
fi

# Configure npm to use system Python (fix for Python 3.13+ distutils issue)
echo "Configuring npm to use system Python..."
npm config set python /usr/bin/python3
echo 'export npm_config_python=/usr/bin/python3' >> ~/.bashrc
log_info "npm configured to use system Python"

# Create necessary directories
echo "Creating directories..."
mkdir -p ~/ARDEN
mkdir -p ~/Notes
mkdir -p ~/Documents
sudo mkdir -p /var/log/arden
sudo chown -R arden:arden /var/log/arden

log_info "Directories created"

# Clone repository if not exists
if [ ! -d "~/ARDEN/.git" ]; then
    echo "Repository needs to be cloned manually."
    echo "Run: git clone https://github.com/yourusername/ARDEN.git ~/ARDEN"
    echo "Then: cd ~/ARDEN && git checkout arden-prod"
else
    log_info "ARDEN repository already exists"
fi

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "IMPORTANT: npm is now configured to use system Python (/usr/bin/python3)"
echo "This fixes the 'distutils' error with Python 3.13+"
echo ""
echo "Next steps:"
echo "  1. Clone/pull ARDEN repository"
echo "  2. Copy .env.rocket to .env and configure API keys"
echo "  3. Deactivate any venv: deactivate 2>/dev/null || true"
echo "  4. Run: cd ~/ARDEN/api && npm install --production"
echo "  5. Configure nginx: sudo cp ~/ARDEN/config/nginx-rocket.conf /etc/nginx/sites-available/arden"
echo "  6. Get SSL certificate: sudo certbot --nginx -d rocket.id10t.social"
echo "  7. Start services: pm2 start ~/ARDEN/ecosystem.config.js"
echo ""
