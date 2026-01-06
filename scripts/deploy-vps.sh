#!/bin/bash

# ARDEN VPS Deployment Script
# This script automates the deployment process on a fresh VPS

set -e  # Exit on error

echo "========================================="
echo "ARDEN VPS Deployment Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root${NC}"
    echo "Run as a regular user with sudo privileges"
    exit 1
fi

echo -e "${GREEN}Step 1: Checking system requirements${NC}"
echo "----------------------------------------"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found!${NC}"
    echo "Please install Node.js 18+ first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version must be 18 or higher${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 not found!${NC}"
    echo "Please install Python 3.11+ first:"
    echo "  sudo apt install -y python3 python3-pip python3-venv"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version) detected${NC}"

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}⚠ Ollama not found${NC}"
    read -p "Install Ollama now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -fsSL https://ollama.com/install.sh | sh
        echo -e "${GREEN}✓ Ollama installed${NC}"
        
        echo "Pulling llama3.2 model (this may take a few minutes)..."
        ollama pull llama3.2
    else
        echo -e "${YELLOW}Note: You'll need to set up an alternative AI provider${NC}"
    fi
else
    echo -e "${GREEN}✓ Ollama detected${NC}"
fi

echo ""
echo -e "${GREEN}Step 2: Setting up Python virtual environment${NC}"
echo "----------------------------------------"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}Virtual environment already exists${NC}"
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install openai-whisper edge-tts torch

echo -e "${GREEN}✓ Python dependencies installed${NC}"

echo ""
echo -e "${GREEN}Step 3: Installing Node.js dependencies${NC}"
echo "----------------------------------------"

cd api
npm install
cd ..

echo -e "${GREEN}✓ Node.js dependencies installed${NC}"

echo ""
echo -e "${GREEN}Step 4: Setting up environment configuration${NC}"
echo "----------------------------------------"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    else
        # Create basic .env file
        cat > .env << EOL
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=

# AI Provider
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434

# Security
ARDEN_API_TOKEN=$(openssl rand -hex 32)
EOL
        echo -e "${GREEN}✓ Created basic .env file${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}IMPORTANT: You need to configure your .env file!${NC}"
    echo ""
    echo "Please edit .env and add:"
    echo "1. TELEGRAM_BOT_TOKEN (from @BotFather)"
    echo "2. Any other API keys you need"
    echo ""
    read -p "Press Enter to edit .env now, or Ctrl+C to exit and edit later..."
    ${EDITOR:-nano} .env
else
    echo -e "${YELLOW}.env file already exists, skipping...${NC}"
fi

echo ""
echo -e "${GREEN}Step 5: Creating log directory${NC}"
echo "----------------------------------------"

mkdir -p logs
echo -e "${GREEN}✓ Log directory created${NC}"

echo ""
echo -e "${GREEN}Step 6: Installing PM2${NC}"
echo "----------------------------------------"

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

echo ""
echo -e "${GREEN}Step 7: Starting ARDEN bot${NC}"
echo "----------------------------------------"

# Update ecosystem.config.js with current user's home directory
USER_HOME=$(eval echo ~$USER)
sed -i "s|/home/arden/ARDEN|$PROJECT_ROOT|g" ecosystem.config.js

echo "Starting bot with PM2..."
pm2 start ecosystem.config.js

echo ""
pm2 status

echo ""
echo -e "${GREEN}Step 8: Setting up auto-start on boot${NC}"
echo "----------------------------------------"

pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $USER_HOME

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Your ARDEN bot is now running!"
echo ""
echo "Next steps:"
echo "1. Test your bot by sending a message on Telegram"
echo "2. View logs: pm2 logs arden-bot"
echo "3. Check status: pm2 status"
echo "4. Restart: pm2 restart arden-bot"
echo ""
echo "Useful commands:"
echo "  pm2 status           - Check bot status"
echo "  pm2 logs arden-bot   - View live logs"
echo "  pm2 restart arden-bot - Restart the bot"
echo "  pm2 stop arden-bot   - Stop the bot"
echo ""
echo "Documentation: docs/HETZNER_DEPLOYMENT.md"
echo ""
