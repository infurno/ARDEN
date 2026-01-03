#!/bin/bash

# ARDEN TODO Summary Script
# Generates a concise summary of consolidated TODOs for voice/text output

TODO_FILE="$HOME/Notes/todo.md"

if [ ! -f "$TODO_FILE" ]; then
    echo "No consolidated TODO file found. Run consolidate-todos.sh first."
    exit 1
fi

# Extract statistics from the file
TOTAL=$(grep "Total TODO items found" "$TODO_FILE" | grep -oE '[0-9]+')
FILES=$(grep "Files with TODOs" "$TODO_FILE" | grep -oE '[0-9]+')
UNCHECKED=$(grep "Unchecked items" "$TODO_FILE" | grep -oE '[0-9]+')
CHECKED=$(grep "Checked items" "$TODO_FILE" | grep -oE '[0-9]+')

# Get 5 most recent unchecked items from the file
RECENT=$(grep "^- \[ \]" "$TODO_FILE" | head -5)

# Output summary
echo "📋 TODO Summary"
echo ""
echo "Total: $TOTAL items across $FILES files"
echo "Active: $UNCHECKED unchecked tasks"
echo "Done: $CHECKED completed tasks"
echo ""
if [ -n "$RECENT" ]; then
    echo "Top 5 Unchecked Items:"
    echo "$RECENT"
else
    echo "No unchecked items found."
fi
echo ""
echo "Full list: ~/Notes/todo.md"
