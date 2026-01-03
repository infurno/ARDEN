#!/bin/bash

# ARDEN Firewall Setup Script
# Configures UFW to allow ARDEN web interface access

set -e

echo "ARDEN Firewall Configuration"
echo "============================"
echo ""

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    echo "❌ UFW is not installed"
    echo "Install with: sudo pacman -S ufw"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script requires root privileges"
    echo "Run with: sudo ./scripts/setup-firewall.sh"
    exit 1
fi

echo "Configuring firewall rules for ARDEN..."
echo ""

# Allow port 3001 for web interface
echo "► Allowing port 3001/tcp (ARDEN Web Interface)..."
ufw allow 3001/tcp comment 'ARDEN Web Interface'

# Optional: Allow common ports if not already configured
# Uncomment if needed:
# echo "► Allowing port 22/tcp (SSH)..."
# ufw allow 22/tcp comment 'SSH'

echo ""
echo "Current firewall status:"
ufw status numbered

echo ""
echo "✅ Firewall configuration complete!"
echo ""
echo "Access ARDEN Web Interface:"
echo "  - Local:     http://localhost:3001"
echo "  - LAN:       http://192.168.4.57:3001"
echo "  - Tailscale: http://100.115.162.26:3001"
echo ""
