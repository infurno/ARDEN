#!/bin/bash

# ARDEN Web Interface Stop Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$ARDEN_ROOT/.arden-web.pid"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping ARDEN Web Interface...${NC}"

if [ ! -f "$PID_FILE" ]; then
    echo -e "${RED}Web interface is not running (no PID file found)${NC}"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${RED}Process not found (PID: $PID)${NC}"
    rm -f "$PID_FILE"
    exit 1
fi

# Try graceful shutdown first
kill "$PID"

# Wait for process to stop (max 10 seconds)
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}Web interface stopped successfully${NC}"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
echo -e "${YELLOW}Process didn't stop gracefully, forcing...${NC}"
kill -9 "$PID"
rm -f "$PID_FILE"
echo -e "${GREEN}Web interface stopped${NC}"
