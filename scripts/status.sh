#!/bin/bash
# ARDEN Status Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$ARDEN_ROOT/.arden.pid"
LOG_FILE="$ARDEN_ROOT/api/logs/arden.log"

echo "=== ARDEN Status ==="
echo ""

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo "Status: NOT RUNNING (no PID file)"
    exit 1
fi

PID=$(cat "$PID_FILE")

# Check if process is running
if ps -p "$PID" > /dev/null 2>&1; then
    echo "Status: RUNNING"
    echo "PID: $PID"
    echo ""
    echo "Process Info:"
    ps -p "$PID" -o pid,ppid,cmd,%cpu,%mem,etime
    echo ""
    echo "Log File: $LOG_FILE"
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "Last 10 log lines:"
        tail -n 10 "$LOG_FILE"
    fi
else
    echo "Status: NOT RUNNING (stale PID file)"
    rm -f "$PID_FILE"
    exit 1
fi
