#!/bin/bash
# ProtonMail Bridge Setup Script for ARDEN
# Automates installation, configuration, and integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
CREDENTIALS_DIR="$ARDEN_ROOT/heartbeat/credentials"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ARDEN ProtonMail Bridge Setup                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running on Arch Linux
if ! command -v pacman &> /dev/null; then
    echo -e "${RED}❌ This script is designed for Arch Linux${NC}"
    echo "Please install ProtonMail Bridge manually for your distribution"
    exit 1
fi

# Function to check if AUR helper exists
check_aur_helper() {
    if command -v yay &> /dev/null; then
        AUR_HELPER="yay"
    elif command -v paru &> /dev/null; then
        AUR_HELPER="paru"
    else
        AUR_HELPER=""
    fi
}

# Step 1: Install ProtonMail Bridge
echo -e "${YELLOW}Step 1: Installing ProtonMail Bridge...${NC}"

if command -v protonmail-bridge &> /dev/null; then
    echo -e "${GREEN}✓ ProtonMail Bridge already installed${NC}"
else
    check_aur_helper
    
    if [ -n "$AUR_HELPER" ]; then
        echo "Using $AUR_HELPER to install..."
        $AUR_HELPER -S protonmail-bridge
    else
        echo -e "${YELLOW}⚠ No AUR helper found (yay/paru)${NC}"
        echo "Installing yay first..."
        
        # Install yay
        git clone https://aur.archlinux.org/yay.git /tmp/yay
        cd /tmp/yay
        makepkg -si --noconfirm
        cd -
        
        yay -S protonmail-bridge
    fi
    
    echo -e "${GREEN}✓ ProtonMail Bridge installed${NC}"
fi

# Step 2: Setup systemd service
echo ""
echo -e "${YELLOW}Step 2: Setting up systemd service...${NC}"

mkdir -p ~/.config/systemd/user
cp "$ARDEN_ROOT/.config/systemd/user/protonmail-bridge.service" ~/.config/systemd/user/

systemctl --user daemon-reload
systemctl --user enable protonmail-bridge

echo -e "${GREEN}✓ Systemd service configured${NC}"

# Step 3: Initial configuration
echo ""
echo -e "${YELLOW}Step 3: Initial Bridge Configuration${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "You need to authenticate with ProtonMail."
echo ""
echo "Options:"
echo "  1) GUI mode (recommended for first setup)"
echo "  2) CLI mode (for headless servers)"
echo ""
read -p "Choose option (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Starting ProtonMail Bridge in GUI mode..."
    echo "Please:"
    echo "  1. Login with your ProtonMail credentials"
    echo "  2. Complete 2FA if enabled"
    echo "  3. Go to Settings → Show IMAP/SMTP password"
    echo "  4. Note the password (you'll need it next)"
    echo ""
    read -p "Press Enter when ready to start..."
    
    protonmail-bridge &
    BRIDGE_PID=$!
    
    echo "Bridge started. Complete setup in the GUI window."
    read -p "Press Enter when you've noted the bridge password..."
    
    kill $BRIDGE_PID 2>/dev/null || true
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "Starting ProtonMail Bridge in CLI mode..."
    echo "Follow the prompts to login."
    echo ""
    read -p "Press Enter to start..."
    
    protonmail-bridge --cli
else
    echo -e "${RED}Invalid option${NC}"
    exit 1
fi

# Step 4: Get credentials
echo ""
echo -e "${YELLOW}Step 4: Configure ARDEN Credentials${NC}"
echo ""

read -p "Enter your ProtonMail email address: " email
read -sp "Enter your Bridge IMAP password (from Bridge settings): " password
echo ""

# Save to .env
echo ""
echo -e "${BLUE}Saving credentials to .env file...${NC}"

# Check if already exists
if grep -q "PROTONMAIL" "$ARDEN_ROOT/.env"; then
    # Update existing
    sed -i "s/PROTONMAIL_USERNAME=.*/PROTONMAIL_USERNAME=$email/" "$ARDEN_ROOT/.env"
    sed -i "s/PROTONMAIL_BRIDGE_PASSWORD=.*/PROTONMAIL_BRIDGE_PASSWORD=$password/" "$ARDEN_ROOT/.env"
else
    # Add new
    cat >> "$ARDEN_ROOT/.env" << EOF

# ProtonMail Bridge Configuration
PROTONMAIL_USERNAME=$email
PROTONMAIL_BRIDGE_PASSWORD=$password
EOF
fi

echo -e "${GREEN}✓ Credentials saved${NC}"

# Step 5: Test connection
echo ""
echo -e "${YELLOW}Step 5: Testing Connection...${NC}"

cd "$ARDEN_ROOT/heartbeat"
source .venv/bin/activate

python -c "
from sources.imap import get_protonmail_client
import os

# Check env
if not os.getenv('PROTONMAIL_USERNAME'):
    print('❌ Credentials not loaded')
    exit(1)

client = get_protonmail_client()
if not client:
    print('❌ Failed to create client')
    exit(1)

if client.connect():
    print('✅ Connected to ProtonMail Bridge!')
    emails = client.check_unread()
    print(f'📧 Found {len(emails)} unread emails')
    client.disconnect()
else:
    print('❌ Failed to connect')
    exit(1)
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Connection test passed${NC}"
else
    echo -e "${RED}❌ Connection test failed${NC}"
    echo "Make sure protonmail-bridge is running"
    exit 1
fi

# Step 6: Update heartbeat config
echo ""
echo -e "${YELLOW}Step 6: Updating Heartbeat Configuration...${NC}"

# Add protonmail source to HEARTBEAT.md if not present
if ! grep -q "protonmail:" "$ARDEN_ROOT/HEARTBEAT.md"; then
    cat >> "$ARDEN_ROOT/HEARTBEAT.md" << 'EOF'

## ProtonMail Integration

### Bridge Connection
- **Host:** 127.0.0.1:1143
- **Username:** $PROTONMAIL_USERNAME
- **Password:** $PROTONMAIL_BRIDGE_PASSWORD
- **Protocol:** IMAP (local)

### Configuration
```yaml
sources:
  protonmail:
    enabled: true
    type: imap
    host: 127.0.0.1
    port: 1143
    folders:
      - INBOX
      - Starred
    priority_keywords:
      - urgent
      - important
      - meeting
      - deadline
```
EOF
    echo -e "${GREEN}✓ HEARTBEAT.md updated${NC}"
fi

# Step 7: Start services
echo ""
echo -e "${YELLOW}Step 7: Starting Services...${NC}"

echo "Starting ProtonMail Bridge..."
systemctl --user start protonmail-bridge
sleep 3

echo "Checking status..."
if systemctl --user is-active protonmail-bridge &>/dev/null; then
    echo -e "${GREEN}✓ Bridge is running${NC}"
else
    echo -e "${YELLOW}⚠ Bridge service not running${NC}"
    echo "Start manually with: systemctl --user start protonmail-bridge"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Setup Complete!                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. ProtonMail Bridge is now running as a systemd service"
echo "  2. ARDEN Heartbeat can now access your ProtonMail"
echo "  3. Restart heartbeat to enable ProtonMail monitoring:"
echo ""
echo "     pm2 restart arden-heartbeat"
echo ""
echo "Commands:"
echo "  Check bridge status:  systemctl --user status protonmail-bridge"
echo "  View bridge logs:     journalctl --user -u protonmail-bridge -f"
echo "  Test connection:      python heartbeat/sources/imap.py"
echo ""
