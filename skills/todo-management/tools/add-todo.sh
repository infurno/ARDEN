#!/bin/bash
#
# Add TODO Skill Tool
# Adds a new TODO item to todo.md in Notes directory
#
# Usage: add-todo.sh "TODO text" [target-file]
#   - TODO text: The text of the TODO item (required)
#   - target-file: Optional filename to add TODO to (default: todo.md)
#
# Examples:
#   add-todo.sh "Review pull request #42"
#   add-todo.sh "Deploy to production" "deployment-checklist.md"
#

set -e  # Exit on error

# Determine ARDEN root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Configuration
NOTES_DIR="${HOME}/Notes"
DEFAULT_TODO_FILE="todo.md"
CONSOLIDATE_SCRIPT="${ARDEN_ROOT}/scripts/consolidate-todos.sh"

# Parse arguments
TODO_TEXT="$1"
TARGET_FILE="${2:-$DEFAULT_TODO_FILE}"

# Validate TODO text
if [ -z "$TODO_TEXT" ]; then
    echo "❌ Error: TODO text is required"
    echo ""
    echo "Usage: $0 \"TODO text\" [target-file]"
    echo ""
    echo "Examples:"
    echo "  $0 \"Review pull request #42\""
    echo "  $0 \"Deploy to production\" \"deployment-checklist.md\""
    exit 1
fi

# Build full path to target file
TARGET_PATH="${NOTES_DIR}/${TARGET_FILE}"

# Ensure Notes directory exists
if [ ! -d "$NOTES_DIR" ]; then
    echo "❌ Error: Notes directory does not exist: $NOTES_DIR"
    exit 1
fi

# Create target file if it doesn't exist
if [ ! -f "$TARGET_PATH" ]; then
    echo "# TODOs" > "$TARGET_PATH"
    echo "" >> "$TARGET_PATH"
    echo "📝 Created new TODO file: $TARGET_FILE"
fi

# Add the TODO item
echo "- [ ] ${TODO_TEXT}" >> "$TARGET_PATH"

# Run consolidation script to update consolidated todo.md
if [ -x "$CONSOLIDATE_SCRIPT" ]; then
    "$CONSOLIDATE_SCRIPT" > /dev/null 2>&1 || true
fi

# Success message
echo "✅ TODO added successfully!"
echo ""
echo "📋 TODO: ${TODO_TEXT}"
echo "📄 File: ${TARGET_FILE}"
echo "📍 Location: ${TARGET_PATH}"

# Return the TODO text for confirmation
echo ""
echo "RESULT: TODO added to ${TARGET_FILE}"
