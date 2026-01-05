#!/bin/bash
#
# Add TODO Skill Tool
# Adds a new TODO item to the appropriate category file in Notes/todos/ directory
#
# Usage: add-todo.sh "TODO text" [category]
#   - TODO text: The text of the TODO item (required)
#   - category: work, personal, or side-projects (default: personal)
#
# Examples:
#   add-todo.sh "Review pull request #42" "work"
#   add-todo.sh "Buy groceries" "personal"
#   add-todo.sh "Deploy to production"  # defaults to personal
#

set -e  # Exit on error

# Determine ARDEN root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Configuration
NOTES_DIR="${HOME}/Notes"
TODOS_DIR="${NOTES_DIR}/todos"
DEFAULT_CATEGORY="personal"
CONSOLIDATE_SCRIPT="${ARDEN_ROOT}/scripts/consolidate-todos.sh"

# Parse arguments
TODO_TEXT="$1"
CATEGORY="${2:-$DEFAULT_CATEGORY}"

# Validate category and map to filename
case "$CATEGORY" in
    work)
        TARGET_FILE="work.md"
        CATEGORY_NAME="Work"
        ;;
    personal)
        TARGET_FILE="personal.md"
        CATEGORY_NAME="Personal"
        ;;
    side-projects|side_projects|sideprojects)
        TARGET_FILE="side-projects.md"
        CATEGORY_NAME="Side Projects"
        ;;
    *)
        # Default to personal for unknown categories
        TARGET_FILE="personal.md"
        CATEGORY_NAME="Personal"
        ;;
esac

# Validate TODO text
if [ -z "$TODO_TEXT" ]; then
    echo "❌ Error: TODO text is required"
    echo ""
    echo "Usage: $0 \"TODO text\" [category]"
    echo ""
    echo "Categories: work, personal, side-projects (default: personal)"
    echo ""
    echo "Examples:"
    echo "  $0 \"Review pull request #42\" \"work\""
    echo "  $0 \"Buy groceries\" \"personal\""
    echo "  $0 \"Deploy to production\"  # defaults to personal"
    exit 1
fi

# Build full path to target file
TARGET_PATH="${TODOS_DIR}/${TARGET_FILE}"

# Ensure Notes directory exists
if [ ! -d "$NOTES_DIR" ]; then
    echo "❌ Error: Notes directory does not exist: $NOTES_DIR"
    exit 1
fi

# Ensure todos directory exists
mkdir -p "$TODOS_DIR"

# Create target file if it doesn't exist
if [ ! -f "$TARGET_PATH" ]; then
    echo "# ${CATEGORY_NAME} TODOs" > "$TARGET_PATH"
    echo "" >> "$TARGET_PATH"
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
echo "🏷️  Category: ${CATEGORY_NAME}"
echo "📄 File: todos/${TARGET_FILE}"
echo "📍 Location: ${TARGET_PATH}"

# Return the TODO text for confirmation
echo ""
echo "RESULT: TODO added to ${CATEGORY_NAME} category"
