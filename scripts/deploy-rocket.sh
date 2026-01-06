#!/bin/bash

# ARDEN Deployment Script for rocket.id10t.social
# Optimized for CPU-only VPS with OpenAI API

set -e

echo "========================================="
echo "ARDEN Deployment for rocket.id10t.social"
echo "CPU-Optimized Configuration"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Running as root. Will create 'arden' user for the application.${NC}"
    RUNNING_AS_ROOT=true
else
    RUNNING_AS_ROOT=false
    ACTUAL_USER="$USER"
    USER_HOME="$HOME"
fi

echo -e "${GREEN}Step 1: System Update & Dependencies${NC}"
echo "----------------------------------------"

if [ "$RUNNING_AS_ROOT" = true ]; then
    apt update
    apt upgrade -y
    
    echo "Installing system dependencies..."
    apt install -y curl git build-essential ufw fail2ban python3 python3-pip python3-venv
    
    # Install Node.js 18
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    echo -e "${GREEN}✓ System dependencies installed${NC}"
else
    echo -e "${YELLOW}Not running as root. Skipping system package installation.${NC}"
    echo "Make sure Node.js 18+ and Python 3.11+ are installed."
fi

echo ""
echo -e "${GREEN}Step 2: User Setup${NC}"
echo "----------------------------------------"

if [ "$RUNNING_AS_ROOT" = true ]; then
    # Create arden user if it doesn't exist
    if id "arden" &>/dev/null; then
        echo -e "${YELLOW}User 'arden' already exists${NC}"
    else
        echo "Creating 'arden' user..."
        adduser arden --gecos "ARDEN Bot User" --disabled-password
        echo "arden:$(openssl rand -base64 12)" | chpasswd
        usermod -aG sudo arden
        echo -e "${GREEN}✓ User 'arden' created${NC}"
    fi
    
    ACTUAL_USER="arden"
    USER_HOME="/home/arden"
    
    echo ""
    echo -e "${BLUE}Switching to 'arden' user...${NC}"
    echo "Please run the following commands as the 'arden' user:"
    echo ""
    echo "  su - arden"
    echo "  cd ~"
    echo "  git clone https://github.com/YOUR_USERNAME/ARDEN.git"
    echo "  cd ARDEN"
    echo "  git checkout remote-server"
    echo "  ./scripts/deploy-rocket.sh"
    echo ""
    echo "Then continue with configuration."
    exit 0
fi

# From here on, running as non-root user
PROJECT_ROOT="$USER_HOME/ARDEN"

echo "Deploying as user: $ACTUAL_USER"
echo "Home directory: $USER_HOME"
echo ""

echo -e "${GREEN}Step 3: Clone ARDEN Repository${NC}"
echo "----------------------------------------"

if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}ARDEN repository not found at $PROJECT_ROOT${NC}"
    echo "Please clone the repository first:"
    echo "  git clone https://github.com/YOUR_USERNAME/ARDEN.git $PROJECT_ROOT"
    echo "  cd $PROJECT_ROOT"
    echo "  git checkout remote-server"
    exit 1
fi

cd "$PROJECT_ROOT"

echo ""
echo -e "${GREEN}Step 4: Python Virtual Environment${NC}"
echo "----------------------------------------"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}Virtual environment already exists${NC}"
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies (optimized for CPU)..."
pip install --upgrade pip
pip install openai-whisper edge-tts

# Install CPU-only PyTorch (smaller, faster install)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

echo -e "${GREEN}✓ Python dependencies installed${NC}"

echo ""
echo -e "${GREEN}Step 5: Node.js Dependencies${NC}"
echo "----------------------------------------"

cd api
npm install
cd ..

echo -e "${GREEN}✓ Node.js dependencies installed${NC}"

echo ""
echo -e "${GREEN}Step 6: Configuration${NC}"
echo "----------------------------------------"

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    # Set default to OpenAI (CPU-optimized)
    sed -i 's/AI_PROVIDER=ollama/AI_PROVIDER=openai/' .env
    sed -i 's/# OPENAI_API_KEY=/OPENAI_API_KEY=/' .env
    sed -i 's/# OPENAI_MODEL=/OPENAI_MODEL=/' .env
    sed -i 's/# USE_OPENAI_WHISPER=/USE_OPENAI_WHISPER=/' .env
    
    # Generate random API token
    RANDOM_TOKEN=$(openssl rand -hex 32)
    sed -i "s/ARDEN_API_TOKEN=.*/ARDEN_API_TOKEN=$RANDOM_TOKEN/" .env
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: You must edit .env and add your API keys!${NC}"
    echo ""
    echo "Required configuration:"
    echo "  1. TELEGRAM_BOT_TOKEN - Get from @BotFather"
    echo "  2. OPENAI_API_KEY - Get from https://platform.openai.com/api-keys"
    echo ""
    echo "Optional (but recommended for speed):"
    echo "  3. USE_OPENAI_WHISPER=true - Use OpenAI for fast transcription"
    echo ""
    
    read -p "Press Enter to edit .env now (recommended), or Ctrl+C to exit and edit later..."
    ${EDITOR:-nano} .env
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

echo ""
echo -e "${GREEN}Step 7: Create Log Directory${NC}"
echo "----------------------------------------"

mkdir -p logs
echo -e "${GREEN}✓ Log directory created${NC}"

echo ""
echo -e "${GREEN}Step 8: Install PM2${NC}"
echo "----------------------------------------"

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

echo ""
echo -e "${GREEN}Step 9: Update PM2 Config${NC}"
echo "----------------------------------------"

# Update ecosystem.config.js with current paths
sed -i "s|/home/arden/ARDEN|$PROJECT_ROOT|g" ecosystem.config.js

echo ""
echo -e "${GREEN}Step 10: Security - Firewall${NC}"
echo "----------------------------------------"

if [ "$RUNNING_AS_ROOT" = false ]; then
    echo "Configuring firewall (requires sudo)..."
    sudo ufw --force enable
    sudo ufw allow OpenSSH
    echo -e "${GREEN}✓ Firewall configured${NC}"
fi

echo ""
echo -e "${GREEN}Step 11: Start ARDEN Bot${NC}"
echo "----------------------------------------"

echo "Starting bot with PM2..."
pm2 start ecosystem.config.js

echo ""
pm2 status

echo ""
echo "Setting up auto-start on boot..."
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $ACTUAL_USER --hp $USER_HOME

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Server: rocket.id10t.social${NC}"
echo -e "${BLUE}User: $ACTUAL_USER${NC}"
echo -e "${BLUE}Path: $PROJECT_ROOT${NC}"
echo ""
echo "Your ARDEN bot is now running!"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify your .env has correct API keys"
echo "2. Test bot in Telegram by sending a message"
echo "3. Add your Telegram User ID to config/arden.json for security"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check bot status"
echo "  pm2 logs arden-bot      - View live logs"
echo "  pm2 restart arden-bot   - Restart the bot"
echo "  pm2 stop arden-bot      - Stop the bot"
echo "  ./scripts/backup.sh     - Create backup"
echo ""
echo "Performance tips (CPU-only):"
echo "  - Use OpenAI Whisper API for fast transcription (set USE_OPENAI_WHISPER=true)"
echo "  - Or use smaller local Whisper model (edit voice processing to use 'tiny' model)"
echo "  - Monitor costs at https://platform.openai.com/usage"
echo ""
echo "Expected response times:"
echo "  - With OpenAI Whisper API: 3-6 seconds"
echo "  - With local Whisper: 7-19 seconds"
echo ""
echo "Documentation: DEPLOY_ROCKET.md"
echo ""
