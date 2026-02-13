#!/bin/bash
# Setup script for ARDEN Memory System
# Creates Python virtual environment and installs dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$SCRIPT_DIR/.venv"

echo "=== ARDEN Memory System Setup ==="
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

# Create logs directory
mkdir -p "$ARDEN_ROOT/logs"

# Create data directory (for memory.db)
mkdir -p "$ARDEN_ROOT/data"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the memory server:"
echo "  source $VENV_DIR/bin/activate"
echo "  python -m memory.server"
echo ""
echo "Or via PM2:"
echo "  pm2 start ecosystem.config.js --only arden-memory"
echo ""
