#!/bin/bash
# Setup passwordless sudo for arden user on VPS
# This must be run once before automated deployment

set -e

DEPLOY_HOST="rocket.id10t.social"
DEPLOY_USER="arden"

echo "========================================="
echo "  Setup Passwordless Sudo for ${DEPLOY_USER}"
echo "========================================="
echo ""

echo "This will configure the ${DEPLOY_USER} user to run sudo without password."
echo "You will be prompted for the password ONCE to make this change."
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "▶ Configuring passwordless sudo on VPS..."

# SSH and configure sudoers
ssh -t ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
# Create sudoers.d file for arden user
echo "${USER} ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/${USER} > /dev/null

# Set correct permissions
sudo chmod 0440 /etc/sudoers.d/${USER}

# Verify it works
sudo -n true 2>/dev/null && echo "✓ Passwordless sudo configured successfully!" || echo "✗ Failed to configure passwordless sudo"
ENDSSH

echo ""
echo "========================================="
echo "✓ Setup complete!"
echo "========================================="
echo ""
echo "You can now run: ./scripts/deploy-full-auto.sh"
echo ""
