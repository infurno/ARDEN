#!/bin/bash
#
# Quick TODO Skill Tests
# Tests the most common scenarios to check if TODO skill is working
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== TODO Skill Quick Tests ===${NC}\n"

# Setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADD_TODO="${SCRIPT_DIR}/tools/add-todo.sh"
TODOS_DIR="${HOME}/Notes/todos"
BACKUP_DIR="/tmp/todos-backup-$$"

# Backup existing TODOs
echo -e "${YELLOW}Backing up existing TODOs...${NC}"
mkdir -p "$BACKUP_DIR"
if [ -d "$TODOS_DIR" ]; then
    cp -r "$TODOS_DIR" "$BACKUP_DIR/" 2>/dev/null || true
fi

# Clean for testing
rm -rf "$TODOS_DIR"
mkdir -p "$TODOS_DIR"

echo -e "${GREEN}✓ Setup complete${NC}\n"

# Test counter
PASSED=0
FAILED=0

# Test function
test_todo() {
    local name="$1"
    local text="$2"
    local category="$3"
    local expected_file="${TODOS_DIR}/${4}"
    
    echo -e "${BLUE}Test: ${name}${NC}"
    
    # Run add-todo
    if "$ADD_TODO" "$text" "$category" > /dev/null 2>&1; then
        # Check if file was created and contains the TODO
        if [ -f "$expected_file" ] && grep -qF "- [ ] $text" "$expected_file"; then
            echo -e "  ${GREEN}✓ PASSED${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "  ${RED}✗ FAILED - TODO not found in file${NC}"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "  ${RED}✗ FAILED - Script execution failed${NC}"
        ((FAILED++))
        return 1
    fi
}

# Run tests
echo -e "${YELLOW}Running tests...${NC}\n"

test_todo "Work TODO" "Review pull request #42" "work" "work.md"
test_todo "Personal TODO" "Buy groceries" "personal" "personal.md"
test_todo "Side project TODO" "Improve ARDEN features" "side-projects" "side-projects.md"
test_todo "Default category" "Call dentist" "" "personal.md"
test_todo "Invalid category" "Test item" "invalid" "personal.md"
test_todo "Special characters" "Fix bug #123 - API error" "work" "work.md"
test_todo "Multiple work items" "Deploy to staging" "work" "work.md"
test_todo "Long TODO text" "Schedule meeting to discuss Q4 roadmap and review progress" "work" "work.md"

# Count TODOs
echo ""
echo -e "${YELLOW}Counting TODOs in each file...${NC}"
for file in work.md personal.md side-projects.md; do
    if [ -f "${TODOS_DIR}/${file}" ]; then
        count=$(grep -c "^- \[ \]" "${TODOS_DIR}/${file}" || echo "0")
        echo -e "  ${file}: ${CYAN}${count}${NC} unchecked TODOs"
    fi
done

# Show file contents
echo ""
echo -e "${YELLOW}=== Work TODOs (work.md) ===${NC}"
cat "${TODOS_DIR}/work.md" 2>/dev/null || echo "File not found"

echo ""
echo -e "${YELLOW}=== Personal TODOs (personal.md) ===${NC}"
cat "${TODOS_DIR}/personal.md" 2>/dev/null || echo "File not found"

echo ""
echo -e "${YELLOW}=== Side Projects TODOs (side-projects.md) ===${NC}"
cat "${TODOS_DIR}/side-projects.md" 2>/dev/null || echo "File not found"

# Summary
echo ""
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "  Passed: ${GREEN}${PASSED}${NC}"
echo -e "  Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
fi

echo ""
echo -e "${YELLOW}To restore your original TODOs:${NC}"
echo -e "  cp -r ${BACKUP_DIR}/todos ${HOME}/Notes/"
echo ""
echo -e "${YELLOW}To keep these test TODOs:${NC}"
echo -e "  rm -rf ${BACKUP_DIR}"
echo ""

exit $FAILED
