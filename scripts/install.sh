#!/bin/bash

# ARDEN Installation Script
# Sets up the complete ARDEN infrastructure with voice capabilities

set -e

ARDEN_HOME="$HOME/ARDEN"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}🚀 ARDEN Installation${NC}"
echo "AI Routine Daily Engagement Nexus"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found${NC}"
  echo "Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js version too old (found v$NODE_VERSION, need v18+)${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check Claude Code
if ! command -v claude &> /dev/null; then
  echo -e "${YELLOW}⚠️  Claude Code CLI not found${NC}"
  echo "Install from: https://github.com/anthropics/claude-code"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}✅ Claude Code CLI${NC}"
fi

echo ""

# Create directory structure (if not exists)
echo "Setting up directory structure..."
cd "$ARDEN_HOME"

mkdir -p skills
mkdir -p history/{sessions,learnings,decisions,research,security}
mkdir -p agents
mkdir -p workflows
mkdir -p context
mkdir -p config/hooks
mkdir -p voice/{recordings,responses}
mkdir -p api
mkdir -p scripts

echo -e "${GREEN}✅ Directory structure created${NC}"

# Install Node.js dependencies
echo ""
echo "Installing Node.js dependencies..."
cd "$ARDEN_HOME/api"

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json not found in api/${NC}"
  exit 1
fi

npm install

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Make scripts executable
echo ""
echo "Setting up executable scripts..."
chmod +x "$ARDEN_HOME/config/hooks/"*.sh 2>/dev/null || true
chmod +x "$ARDEN_HOME/scripts/"*.sh 2>/dev/null || true

echo -e "${GREEN}✅ Scripts configured${NC}"

# Create .env template
echo ""
echo "Creating environment configuration..."

ENV_FILE="$ARDEN_HOME/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" << 'EOF'
# ARDEN Environment Configuration

# OpenAI API (for Whisper speech-to-text)
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs API (for text-to-speech) - Optional
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Telegram Bot (for voice messaging)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# ARDEN API Security
ARDEN_API_TOKEN=generate_random_secure_token_here

# Claude API (if using API mode)
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
EOF

  echo -e "${GREEN}✅ .env template created${NC}"
  echo -e "${YELLOW}⚠️  Edit .env with your API keys${NC}"
else
  echo -e "${YELLOW}⚠️  .env already exists, skipping${NC}"
fi

# Add ARDEN to PATH
echo ""
echo "Setting up ARDEN CLI..."

ARDEN_BIN="$ARDEN_HOME/bin"
mkdir -p "$ARDEN_BIN"

# Create ARDEN CLI wrapper
cat > "$ARDEN_BIN/arden" << 'EOF'
#!/bin/bash

# ARDEN CLI Wrapper
# Executes Claude Code with ARDEN context and configuration

ARDEN_HOME="$HOME/ARDEN"

# Load environment
if [ -f "$ARDEN_HOME/.env" ]; then
  export $(cat "$ARDEN_HOME/.env" | grep -v '^#' | xargs)
fi

# Check for voice flag
VOICE_MODE=false
if [[ "$1" == "--voice" ]]; then
  VOICE_MODE=true
  shift
fi

# Execute Claude Code with ARDEN config
cd "$ARDEN_HOME"

if [ "$VOICE_MODE" = true ]; then
  echo "🎤 Voice mode not yet implemented in CLI"
  echo "💡 Use Telegram bot for voice interaction"
  exit 1
fi

# Run Claude Code with prompt
claude "$@"
EOF

chmod +x "$ARDEN_BIN/arden"

# Check if already in PATH
if [[ ":$PATH:" != *":$ARDEN_BIN:"* ]]; then
  echo ""
  echo -e "${YELLOW}📝 Add ARDEN to your PATH:${NC}"
  echo ""

  SHELL_NAME=$(basename "$SHELL")
  case "$SHELL_NAME" in
    bash)
      RC_FILE="$HOME/.bashrc"
      ;;
    zsh)
      RC_FILE="$HOME/.zshrc"
      ;;
    *)
      RC_FILE="$HOME/.profile"
      ;;
  esac

  echo "Add this line to $RC_FILE:"
  echo ""
  echo "export PATH=\"\$HOME/ARDEN/bin:\$PATH\""
  echo ""
  echo "Then run: source $RC_FILE"
else
  echo -e "${GREEN}✅ ARDEN already in PATH${NC}"
fi

# Installation complete
echo ""
echo -e "${BOLD}${GREEN}✨ ARDEN Installation Complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env with your API keys:"
echo "   nano ~/ARDEN/.env"
echo ""
echo "2. Set up Telegram bot (recommended for voice):"
echo "   - Message @BotFather on Telegram"
echo "   - Create new bot with /newbot"
echo "   - Copy token to .env"
echo ""
echo "3. Start Telegram bot:"
echo "   cd ~/ARDEN/api"
echo "   npm start"
echo ""
echo "4. Or use CLI directly:"
echo "   arden \"What's on my schedule?\""
echo ""
echo "📚 Read the full guide:"
echo "   cat ~/ARDEN/README.md"
echo ""
echo "🎯 Happy automating!"
