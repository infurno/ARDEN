#!/bin/bash
# ARDEN Stop Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$ARDEN_ROOT/.arden.pid"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo "ARDEN is not running (no PID file found)"
    exit 1
fi

PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "ARDEN is not running (stale PID file)"
    rm -f "$PID_FILE"
    exit 1
fi

# Stop the process
echo "Stopping ARDEN (PID: $PID)..."
kill "$PID"

# Wait for process to stop (max 10 seconds)
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo "ARDEN stopped successfully"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
echo "Process didn't stop gracefully, force killing..."
kill -9 "$PID" 2>/dev/null
rm -f "$PID_FILE"
echo "ARDEN force stopped"
