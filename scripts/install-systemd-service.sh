#!/bin/bash

# Install ARDEN as a systemd service
# Alternative to PM2 for those who prefer systemd

set -e

echo "========================================="
echo "ARDEN systemd Service Installer"
echo "========================================="
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo:"
    echo "  sudo ./scripts/install-systemd-service.sh"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"
USER_HOME=$(eval echo ~$ACTUAL_USER)
PROJECT_ROOT="$USER_HOME/ARDEN"

echo "Installing ARDEN systemd service..."
echo "User: $ACTUAL_USER"
echo "Home: $USER_HOME"
echo "ARDEN Path: $PROJECT_ROOT"
echo ""

# Check if project exists
if [ ! -d "$PROJECT_ROOT" ]; then
    echo "Error: ARDEN not found at $PROJECT_ROOT"
    echo "Please adjust the path or install ARDEN first"
    exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"
chown $ACTUAL_USER:$ACTUAL_USER "$PROJECT_ROOT/logs"

# Copy and customize service file
SERVICE_FILE="/etc/systemd/system/arden-bot.service"

# Update service file with actual paths
sed "s|/home/arden|$USER_HOME|g" "$PROJECT_ROOT/scripts/arden-bot.service" | \
sed "s|User=arden|User=$ACTUAL_USER|g" > "$SERVICE_FILE"

echo "✓ Service file created: $SERVICE_FILE"

# Reload systemd
systemctl daemon-reload
echo "✓ Systemd reloaded"

# Enable service
systemctl enable arden-bot.service
echo "✓ Service enabled (will start on boot)"

# Start service
systemctl start arden-bot.service
echo "✓ Service started"

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""

# Show status
systemctl status arden-bot.service --no-pager

echo ""
echo "Useful commands:"
echo "  sudo systemctl status arden-bot   - Check service status"
echo "  sudo systemctl restart arden-bot  - Restart service"
echo "  sudo systemctl stop arden-bot     - Stop service"
echo "  sudo systemctl start arden-bot    - Start service"
echo "  sudo journalctl -u arden-bot -f   - View live logs"
echo "  sudo journalctl -u arden-bot -n 100  - View last 100 log lines"
echo ""
echo "Log files:"
echo "  $PROJECT_ROOT/logs/arden-bot.log"
echo "  $PROJECT_ROOT/logs/arden-bot-error.log"
echo ""
