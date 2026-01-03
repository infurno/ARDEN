#!/bin/bash

# ARDEN Web Interface Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$ARDEN_ROOT/api"
PID_FILE="$ARDEN_ROOT/.arden-web.pid"
LOG_FILE="$ARDEN_ROOT/api/logs/web-server.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting ARDEN Web Interface...${NC}"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Web interface is already running (PID: $OLD_PID)${NC}"
        echo -e "Use './scripts/stop-web.sh' to stop it first"
        exit 1
    else
        rm -f "$PID_FILE"
    fi
fi

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Start web server
cd "$API_DIR" || exit 1

nohup node web-server.js >> "$LOG_FILE" 2>&1 &
PID=$!

# Save PID
echo "$PID" > "$PID_FILE"

# Wait a moment and check if it started
sleep 2

if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${GREEN}ARDEN Web Interface started successfully${NC}"
    echo -e "PID: $PID"
    echo -e ""
    echo -e "Access at:"
    echo -e "  ${YELLOW}http://localhost:3001${NC}"
    echo -e "  ${YELLOW}http://127.0.0.1:3001${NC}"
    echo -e ""
    echo -e "Logs: $LOG_FILE"
    echo -e ""
    echo -e "Use './scripts/stop-web.sh' to stop"
    echo -e "Use 'tail -f $LOG_FILE' to follow logs"
else
    echo -e "${RED}Failed to start web interface${NC}"
    rm -f "$PID_FILE"
    echo -e "Check logs: tail $LOG_FILE"
    exit 1
fi
