#!/bin/bash
# ARDEN Start Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$ARDEN_ROOT/.arden.pid"
LOG_FILE="$ARDEN_ROOT/api/logs/arden.log"

# Create logs directory if it doesn't exist
mkdir -p "$ARDEN_ROOT/api/logs"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "ARDEN is already running (PID: $PID)"
        exit 1
    else
        echo "Removing stale PID file..."
        rm -f "$PID_FILE"
    fi
fi

# Activate Python virtual environment
source "$ARDEN_ROOT/venv/bin/activate"

# Start the bot
echo "Starting ARDEN..."
cd "$ARDEN_ROOT/api"

# Clear old log to make debugging easier
> "$LOG_FILE"

# Start in background and save PID  
NODE_ENV=production nohup node telegram-bot.js >> "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

sleep 3

# Verify it started
if ps -p $(cat "$PID_FILE" 2>/dev/null) > /dev/null 2>&1; then
    echo "ARDEN started successfully (PID: $(cat "$PID_FILE"))"
    echo "Logs: $LOG_FILE"
    echo ""
    echo "Use './scripts/status.sh' to check status"
    echo "Use './scripts/stop.sh' to stop"
    echo "Use 'tail -f $LOG_FILE' to follow logs"
else
    echo "Failed to start ARDEN. Check logs: $LOG_FILE"
    echo ""
    echo "Last 20 lines of log:"
    tail -20 "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
