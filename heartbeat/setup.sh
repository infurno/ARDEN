#!/bin/bash
# Setup script for ARDEN Heartbeat System
# Creates Python virtual environment and installs dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$SCRIPT_DIR/.venv"

echo "=== ARDEN Heartbeat System Setup ==="
echo "Directory: $SCRIPT_DIR"
echo ""

# Create virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo "Virtual environment created at $VENV_DIR"
else
    echo "Virtual environment already exists at $VENV_DIR"
fi

# Activate and install dependencies
echo ""
echo "Installing dependencies..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$SCRIPT_DIR/requirements.txt"

# Create credentials directory
mkdir -p "$SCRIPT_DIR/credentials"

# Create logs directory
mkdir -p "$ARDEN_ROOT/logs"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps for Gmail + Calendar integration:"
echo ""
echo "1. Go to Google Cloud Console: https://console.cloud.google.com"
echo "2. Create a new project (or use existing)"
echo "3. Enable Gmail API and Google Calendar API"
echo "4. Create OAuth 2.0 credentials (Desktop application)"
echo "5. Download the client secret JSON file"
echo "6. Save it as: $SCRIPT_DIR/credentials/client_secret.json"
echo ""
echo "7. Set your Anthropic API key:"
echo "   export ANTHROPIC_API_KEY=your-key-here"
echo ""
echo "8. Run the first heartbeat cycle to authenticate:"
echo "   source $VENV_DIR/bin/activate"
echo "   python -m heartbeat.main"
echo "   (This will open a browser for Google OAuth consent)"
echo ""
echo "9. Or start via PM2:"
echo "   pm2 start ecosystem.config.js --only arden-heartbeat"
echo ""
