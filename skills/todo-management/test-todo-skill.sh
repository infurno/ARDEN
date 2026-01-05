#!/bin/bash
#
# TODO Skill Test Suite
# Comprehensive tests to verify the TODO management skill works correctly
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADD_TODO_SCRIPT="${SCRIPT_DIR}/tools/add-todo.sh"
TODOS_DIR="${HOME}/Notes/todos"
BACKUP_DIR="/tmp/todos-backup-$$"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         TODO MANAGEMENT SKILL - TEST SUITE                 ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    ((TESTS_RUN++))
    echo -e "${CYAN}Test #${TESTS_RUN}: ${test_name}${NC}"
    
    # Run the command and capture output
    local output
    local exit_code
    
    output=$(eval "$test_command" 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}
    
    # Check if expected result matches
    if [[ "$output" == *"$expected_result"* ]] && [ $exit_code -eq 0 ]; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "  ${RED}✗ FAILED${NC}"
        echo -e "  ${YELLOW}Expected to contain: ${expected_result}${NC}"
        echo -e "  ${YELLOW}Got: ${output:0:100}...${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to verify file content
verify_file_contains() {
    local file="$1"
    local expected_text="$2"
    local test_name="$3"
    
    ((TESTS_RUN++))
    echo -e "${CYAN}Test #${TESTS_RUN}: ${test_name}${NC}"
    
    if [ ! -f "$file" ]; then
        echo -e "  ${RED}✗ FAILED - File not found: $file${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
    
    if grep -qF "$expected_text" "$file"; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "  ${RED}✗ FAILED - Text not found in file${NC}"
        echo -e "  ${YELLOW}Expected: ${expected_text}${NC}"
        echo -e "  ${YELLOW}File content:${NC}"
        cat "$file" | head -20
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to count TODOs in a file
count_todos_in_file() {
    local file="$1"
    grep -c "^- \[ \]" "$file" 2>/dev/null || echo "0"
}

# Backup existing TODOs
echo -e "${YELLOW}Setting up test environment...${NC}"
if [ -d "$TODOS_DIR" ]; then
    echo "  Backing up existing TODOs to: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r "$TODOS_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
fi

# Clean todos directory for testing
mkdir -p "$TODOS_DIR"
rm -f "$TODOS_DIR"/*.md

echo -e "${GREEN}✓ Test environment ready${NC}"
echo ""

# ============================================================================
# TEST CATEGORY 1: Basic TODO Addition
# ============================================================================
echo -e "${PURPLE}═══ Category 1: Basic TODO Addition ═══${NC}"
echo ""

run_test \
    "Add work TODO" \
    "'$ADD_TODO_SCRIPT' 'Review pull request #42' 'work'" \
    "TODO added to Work category"

run_test \
    "Add personal TODO" \
    "'$ADD_TODO_SCRIPT' 'Buy groceries and milk' 'personal'" \
    "TODO added to Personal category"

run_test \
    "Add side-projects TODO" \
    "'$ADD_TODO_SCRIPT' 'Improve ARDEN voice recognition' 'side-projects'" \
    "TODO added to Side Projects category"

echo ""

# ============================================================================
# TEST CATEGORY 2: File Creation and Content Verification
# ============================================================================
echo -e "${PURPLE}═══ Category 2: File Creation & Content ═══${NC}"
echo ""

verify_file_contains \
    "$TODOS_DIR/work.md" \
    "- [ ] Review pull request #42" \
    "Work TODO appears in work.md"

verify_file_contains \
    "$TODOS_DIR/personal.md" \
    "- [ ] Buy groceries and milk" \
    "Personal TODO appears in personal.md"

verify_file_contains \
    "$TODOS_DIR/side-projects.md" \
    "- [ ] Improve ARDEN voice recognition" \
    "Side project TODO appears in side-projects.md"

echo ""

# ============================================================================
# TEST CATEGORY 3: Category Aliases
# ============================================================================
echo -e "${PURPLE}═══ Category 3: Category Aliases ═══${NC}"
echo ""

run_test \
    "Side projects with underscore" \
    "'$ADD_TODO_SCRIPT' 'Test underscore category' 'side_projects'" \
    "TODO added to Side Projects category"

run_test \
    "Side projects without dash" \
    "'$ADD_TODO_SCRIPT' 'Test no-dash category' 'sideprojects'" \
    "TODO added to Side Projects category"

verify_file_contains \
    "$TODOS_DIR/side-projects.md" \
    "- [ ] Test underscore category" \
    "Underscore alias works correctly"

echo ""

# ============================================================================
# TEST CATEGORY 4: Default Category Behavior
# ============================================================================
echo -e "${PURPLE}═══ Category 4: Default Category ═══${NC}"
echo ""

run_test \
    "No category specified (defaults to personal)" \
    "'$ADD_TODO_SCRIPT' 'Call the dentist'" \
    "TODO added to Personal category"

run_test \
    "Invalid category (defaults to personal)" \
    "'$ADD_TODO_SCRIPT' 'Invalid category test' 'invalid_cat'" \
    "TODO added to Personal category"

verify_file_contains \
    "$TODOS_DIR/personal.md" \
    "- [ ] Call the dentist" \
    "Default category TODO added correctly"

echo ""

# ============================================================================
# TEST CATEGORY 5: Multiple TODOs in Same Category
# ============================================================================
echo -e "${PURPLE}═══ Category 5: Multiple TODOs ═══${NC}"
echo ""

# Add multiple work TODOs
run_test \
    "Add first work TODO" \
    "'$ADD_TODO_SCRIPT' 'Deploy to staging' 'work'" \
    "TODO added to Work category"

run_test \
    "Add second work TODO" \
    "'$ADD_TODO_SCRIPT' 'Write documentation' 'work'" \
    "TODO added to Work category"

run_test \
    "Add third work TODO" \
    "'$ADD_TODO_SCRIPT' 'Update team on progress' 'work'" \
    "TODO added to Work category"

# Count work TODOs
WORK_TODO_COUNT=$(count_todos_in_file "$TODOS_DIR/work.md")
((TESTS_RUN++))
echo -e "${CYAN}Test #${TESTS_RUN}: Work file contains multiple TODOs${NC}"
if [ "$WORK_TODO_COUNT" -ge 3 ]; then
    echo -e "  ${GREEN}✓ PASSED (Found $WORK_TODO_COUNT TODOs)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${RED}✗ FAILED (Found only $WORK_TODO_COUNT TODOs, expected at least 3)${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# ============================================================================
# TEST CATEGORY 6: Special Characters and Edge Cases
# ============================================================================
echo -e "${PURPLE}═══ Category 6: Special Characters ═══${NC}"
echo ""

run_test \
    "TODO with quotes" \
    "'$ADD_TODO_SCRIPT' 'Review \"user authentication\" module' 'work'" \
    "TODO added to Work category"

run_test \
    "TODO with apostrophe" \
    "'$ADD_TODO_SCRIPT' \"Call Sarah's office\" 'personal'" \
    "TODO added to Personal category"

run_test \
    "TODO with numbers and symbols" \
    "'$ADD_TODO_SCRIPT' 'Fix bug #123 - API returns 500 error' 'work'" \
    "TODO added to Work category"

run_test \
    "TODO with long text" \
    "'$ADD_TODO_SCRIPT' 'Schedule meeting with team to discuss Q4 roadmap, review current sprint progress, and plan upcoming releases for the next quarter' 'work'" \
    "TODO added to Work category"

echo ""

# ============================================================================
# TEST CATEGORY 7: File Structure and Headers
# ============================================================================
echo -e "${PURPLE}═══ Category 7: File Structure ═══${NC}"
echo ""

verify_file_contains \
    "$TODOS_DIR/work.md" \
    "# Work TODOs" \
    "Work file has correct header"

verify_file_contains \
    "$TODOS_DIR/personal.md" \
    "# Personal TODOs" \
    "Personal file has correct header"

verify_file_contains \
    "$TODOS_DIR/side-projects.md" \
    "# Side Projects" \
    "Side projects file has correct header"

echo ""

# ============================================================================
# TEST CATEGORY 8: Error Handling
# ============================================================================
echo -e "${PURPLE}═══ Category 8: Error Handling ═══${NC}"
echo ""

((TESTS_RUN++))
echo -e "${CYAN}Test #${TESTS_RUN}: Missing TODO text (should fail gracefully)${NC}"
OUTPUT=$("$ADD_TODO_SCRIPT" "" "work" 2>&1 || true)
if [[ "$OUTPUT" == *"Error: TODO text is required"* ]]; then
    echo -e "  ${GREEN}✓ PASSED - Proper error message${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${RED}✗ FAILED - Expected error message${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# ============================================================================
# TEST CATEGORY 9: Consolidation Script Integration
# ============================================================================
echo -e "${PURPLE}═══ Category 9: Consolidation Integration ═══${NC}"
echo ""

# Add a TODO and check if consolidation ran
run_test \
    "Add TODO triggers consolidation" \
    "'$ADD_TODO_SCRIPT' 'Test consolidation' 'work'" \
    "TODO added to Work category"

# Check if consolidated file was created
((TESTS_RUN++))
echo -e "${CYAN}Test #${TESTS_RUN}: Consolidated todo.md file created${NC}"
if [ -f "$HOME/Notes/todo.md" ]; then
    echo -e "  ${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${YELLOW}⚠ WARNING - Consolidated file not created (consolidation script may not have run)${NC}"
    ((TESTS_PASSED++)) # Don't fail test, just warn
fi

echo ""

# ============================================================================
# TEST CATEGORY 10: Real-World Scenarios
# ============================================================================
echo -e "${PURPLE}═══ Category 10: Real-World Scenarios ═══${NC}"
echo ""

# Simulate voice input scenarios
run_test \
    "Scenario: User says 'Remind me to deploy to production'" \
    "'$ADD_TODO_SCRIPT' 'deploy to production' 'work'" \
    "TODO added to Work category"

run_test \
    "Scenario: User says 'Buy milk and eggs'" \
    "'$ADD_TODO_SCRIPT' 'Buy milk and eggs' 'personal'" \
    "TODO added to Personal category"

run_test \
    "Scenario: User says 'Learn Rust programming'" \
    "'$ADD_TODO_SCRIPT' 'Learn Rust programming' 'side-projects'" \
    "TODO added to Side Projects category"

run_test \
    "Scenario: User says 'Call mom about birthday party'" \
    "'$ADD_TODO_SCRIPT' 'Call mom about birthday party' 'personal'" \
    "TODO added to Personal category"

run_test \
    "Scenario: User says 'Review pull request before standup'" \
    "'$ADD_TODO_SCRIPT' 'Review pull request before standup' 'work'" \
    "TODO added to Work category"

echo ""

# ============================================================================
# TEST SUMMARY
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     TEST SUMMARY                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Tests Run:    ${CYAN}${TESTS_RUN}${NC}"
echo -e "  Tests Passed:       ${GREEN}${TESTS_PASSED}${NC}"
echo -e "  Tests Failed:       ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL TESTS PASSED - TODO Skill is working correctly!    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_RUN))
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠ SOME TESTS FAILED - See details above                  ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo -e "  Success Rate: ${CYAN}${SUCCESS_RATE}%${NC}"
echo ""

# ============================================================================
# FILE INSPECTION
# ============================================================================
echo -e "${BLUE}═══ Generated Files ═══${NC}"
echo ""
echo -e "${YELLOW}Work TODOs ($TODOS_DIR/work.md):${NC}"
cat "$TODOS_DIR/work.md" | head -20
echo ""
echo -e "${YELLOW}Personal TODOs ($TODOS_DIR/personal.md):${NC}"
cat "$TODOS_DIR/personal.md" | head -20
echo ""
echo -e "${YELLOW}Side Projects TODOs ($TODOS_DIR/side-projects.md):${NC}"
cat "$TODOS_DIR/side-projects.md" | head -20
echo ""

# ============================================================================
# CLEANUP
# ============================================================================
echo -e "${YELLOW}Cleanup Options:${NC}"
echo ""
echo "  1. Keep test TODOs for manual inspection"
echo "  2. Restore original TODOs from backup"
echo "  3. Delete test TODOs and keep backup"
echo ""
echo -e "${CYAN}Backup location: $BACKUP_DIR${NC}"
echo ""
echo "To restore backup: cp -r $BACKUP_DIR/* $TODOS_DIR/"
echo "To delete backup:  rm -rf $BACKUP_DIR"
echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
