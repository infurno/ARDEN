#!/bin/bash

# ARDEN Setup Verification Script
# Checks that all components are properly configured

set -e

ARDEN_HOME="$HOME/ARDEN"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}🔍 ARDEN Setup Verification${NC}\n"

# Track issues
ISSUES=0
WARNINGS=0

# Function to check if command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to check if file exists
file_exists() {
  [ -f "$1" ]
}

# Function to check if directory exists
dir_exists() {
  [ -d "$1" ]
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if command_exists node; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
  echo -e "${RED}✗${NC} Node.js not found"
  ((ISSUES++))
fi

# Check npm
if command_exists npm; then
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
  echo -e "${RED}✗${NC} npm not found"
  ((ISSUES++))
fi

# Check Claude Code
if command_exists claude; then
  echo -e "${GREEN}✓${NC} Claude Code CLI installed"
else
  echo -e "${YELLOW}⚠${NC} Claude Code CLI not found (optional for testing)"
  ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking Directory Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Required directories
REQUIRED_DIRS=(
  "$ARDEN_HOME/api"
  "$ARDEN_HOME/skills"
  "$ARDEN_HOME/agents"
  "$ARDEN_HOME/workflows"
  "$ARDEN_HOME/context"
  "$ARDEN_HOME/config"
  "$ARDEN_HOME/history"
  "$ARDEN_HOME/voice"
  "$ARDEN_HOME/scripts"
  "$ARDEN_HOME/docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if dir_exists "$dir"; then
    echo -e "${GREEN}✓${NC} $(basename $dir)/"
  else
    echo -e "${RED}✗${NC} $(basename $dir)/ missing"
    ((ISSUES++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Configuration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Required files
REQUIRED_FILES=(
  "$ARDEN_HOME/config/arden.json"
  "$ARDEN_HOME/api/package.json"
  "$ARDEN_HOME/api/telegram-bot.js"
  "$ARDEN_HOME/README.md"
  "$ARDEN_HOME/QUICKSTART.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  if file_exists "$file"; then
    echo -e "${GREEN}✓${NC} $(basename $file)"
  else
    echo -e "${RED}✗${NC} $(basename $file) missing"
    ((ISSUES++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if file_exists "$ARDEN_HOME/.env"; then
  echo -e "${GREEN}✓${NC} .env file exists"

  # Load .env
  export $(cat "$ARDEN_HOME/.env" | grep -v '^#' | xargs 2>/dev/null)

  # Check required API keys
  if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your_openai_api_key_here" ]; then
    echo -e "${GREEN}✓${NC} OPENAI_API_KEY configured"
  else
    echo -e "${RED}✗${NC} OPENAI_API_KEY not configured"
    ((ISSUES++))
  fi

  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ "$TELEGRAM_BOT_TOKEN" != "your_telegram_bot_token_here" ]; then
    echo -e "${GREEN}✓${NC} TELEGRAM_BOT_TOKEN configured"
  else
    echo -e "${YELLOW}⚠${NC} TELEGRAM_BOT_TOKEN not configured (required for voice)"
    ((WARNINGS++))
  fi

  if [ -n "$ELEVENLABS_API_KEY" ] && [ "$ELEVENLABS_API_KEY" != "your_elevenlabs_api_key_here" ]; then
    echo -e "${GREEN}✓${NC} ELEVENLABS_API_KEY configured"
  else
    echo -e "${YELLOW}⚠${NC} ELEVENLABS_API_KEY not configured (optional for TTS)"
    ((WARNINGS++))
  fi
else
  echo -e "${RED}✗${NC} .env file missing"
  echo -e "  ${YELLOW}→${NC} Copy .env.example to .env and configure"
  ((ISSUES++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Checking Node.js Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if dir_exists "$ARDEN_HOME/api/node_modules"; then
  echo -e "${GREEN}✓${NC} Node.js dependencies installed"
else
  echo -e "${RED}✗${NC} Node.js dependencies not installed"
  echo -e "  ${YELLOW}→${NC} Run: cd ~/ARDEN/api && npm install"
  ((ISSUES++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Checking Executables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if hooks are executable
if [ -x "$ARDEN_HOME/config/hooks/session-start.sh" ]; then
  echo -e "${GREEN}✓${NC} session-start.sh is executable"
else
  echo -e "${YELLOW}⚠${NC} session-start.sh not executable"
  echo -e "  ${YELLOW}→${NC} Run: chmod +x ~/ARDEN/config/hooks/*.sh"
  ((WARNINGS++))
fi

# Check if arden CLI exists
if file_exists "$ARDEN_HOME/bin/arden" && [ -x "$ARDEN_HOME/bin/arden" ]; then
  echo -e "${GREEN}✓${NC} arden CLI is executable"
else
  echo -e "${YELLOW}⚠${NC} arden CLI not found or not executable"
  ((WARNINGS++))
fi

# Check if arden is in PATH
if command_exists arden; then
  echo -e "${GREEN}✓${NC} arden CLI in PATH"
else
  echo -e "${YELLOW}⚠${NC} arden CLI not in PATH"
  echo -e "  ${YELLOW}→${NC} Add to your shell config: export PATH=\"\$HOME/ARDEN/bin:\$PATH\""
  ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Checking Skills"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SKILL_COUNT=$(find "$ARDEN_HOME/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SKILL_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Found $SKILL_COUNT skill(s):"
  find "$ARDEN_HOME/skills" -name "SKILL.md" 2>/dev/null | while read skill; do
    skill_name=$(basename $(dirname "$skill"))
    echo "  • $skill_name"
  done
else
  echo -e "${YELLOW}⚠${NC} No skills found"
  echo -e "  ${YELLOW}→${NC} Create skills in ~/ARDEN/skills/"
  ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. Checking Bot Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command_exists pm2; then
  echo -e "${GREEN}✓${NC} PM2 installed"

  if pm2 list | grep -q "arden-bot"; then
    echo -e "${GREEN}✓${NC} ARDEN bot is running via PM2"
  else
    echo -e "${YELLOW}⚠${NC} ARDEN bot not running"
    echo -e "  ${YELLOW}→${NC} Start with: cd ~/ARDEN/api && pm2 start telegram-bot.js --name arden-bot"
  fi
else
  echo -e "${YELLOW}⚠${NC} PM2 not installed (optional)"
  echo -e "  ${YELLOW}→${NC} Install with: npm install -g pm2"
  ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${BOLD}${GREEN}🎉 Perfect! ARDEN is fully configured!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Start the bot: cd ~/ARDEN/api && npm start"
  echo "  2. Message your Telegram bot"
  echo "  3. Send a voice message to test"
  echo ""
elif [ $ISSUES -eq 0 ]; then
  echo -e "${BOLD}${YELLOW}⚠ ARDEN is configured with $WARNINGS warning(s)${NC}"
  echo ""
  echo "Everything works, but you can improve the setup by addressing the warnings above."
  echo ""
else
  echo -e "${BOLD}${RED}❌ ARDEN has $ISSUES issue(s) and $WARNINGS warning(s)${NC}"
  echo ""
  echo "Please fix the issues above before using ARDEN."
  echo ""
  echo "Quick fixes:"
  echo "  • Run: cd ~/ARDEN && ./scripts/install.sh"
  echo "  • Configure .env: cp .env.example .env && nano .env"
  echo "  • Install deps: cd ~/ARDEN/api && npm install"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For more help, see:"
echo "  • ~/ARDEN/QUICKSTART.md"
echo "  • ~/ARDEN/docs/setup.md"
echo "  • ~/ARDEN/docs/voice.md"
echo ""

exit $ISSUES
