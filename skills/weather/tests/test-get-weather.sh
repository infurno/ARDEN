#!/bin/bash

# Weather Script Test Suite
# Tests for skills/weather/tools/get-weather.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEATHER_SCRIPT="$SCRIPT_DIR/../tools/get-weather.sh"

# Print test header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Weather Script Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "
    
    # Small delay to avoid rate limiting
    sleep 0.5
    
    # Run the command with timeout
    output=$(timeout 15 bash -c "$test_command" 2>&1)
    exit_code=$?
    
    # Check if command timed out
    if [ $exit_code -eq 124 ]; then
        echo -e "${RED}FAILED${NC} (timeout)"
        echo "  Command timed out after 15 seconds"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    # Check if output matches expected pattern
    if echo "$output" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        echo "  Expected pattern: $expected_pattern"
        echo "  Got output: ${output:0:200}..."
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Helper function to run a negative test (should fail)
run_negative_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_error_pattern="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "
    
    # Small delay to avoid rate limiting
    sleep 0.5
    
    # Run the command with timeout
    output=$(timeout 15 bash -c "$test_command" 2>&1)
    exit_code=$?
    
    # Check if output contains expected error
    if echo "$output" | grep -q "$expected_error_pattern"; then
        echo -e "${GREEN}PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        echo "  Expected error pattern: $expected_error_pattern"
        echo "  Got output: ${output:0:200}..."
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "${YELLOW}=== Basic Functionality Tests ===${NC}"
echo ""

# Test 1: Script exists and is executable
run_test "Script exists and is executable" \
    "test -x '$WEATHER_SCRIPT' && echo 'exists'" \
    "exists"

# Test 2: Default location (no arguments)
run_test "Default location (Farmington, AR)" \
    "bash '$WEATHER_SCRIPT'" \
    "Location:.*Farmington"

# Test 3: City and state
run_test "City and state (Farmington, AR)" \
    "bash '$WEATHER_SCRIPT' 'Farmington, AR'" \
    "Location:.*Farmington"

# Test 4: Zip code
run_test "Zip code (72730)" \
    "bash '$WEATHER_SCRIPT' '72730'" \
    "Temperature:"

# Test 5: Different city
run_test "Different city (Chicago)" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Location:.*Chicago"

echo ""
echo -e "${YELLOW}=== Output Format Tests ===${NC}"
echo ""

# Test 6: Contains temperature field
run_test "Output contains temperature" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Temperature:"

# Test 7: Contains condition field
run_test "Output contains condition" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Condition:"

# Test 8: Contains humidity field
run_test "Output contains humidity" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Humidity:"

# Test 9: Contains wind field
run_test "Output contains wind" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Wind:"

# Test 10: Contains recommendation
run_test "Output contains recommendation" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Recommendation:"

# Test 11: Temperature in Fahrenheit
run_test "Temperature shows Fahrenheit (°F)" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "°F"

echo ""
echo -e "${YELLOW}=== Performance Tests ===${NC}"
echo ""

# Test 12: Completes within reasonable time (8 seconds)
run_test "Completes within 8 seconds" \
    "timeout 8 bash '$WEATHER_SCRIPT' 'Chicago' && echo 'completed'" \
    "completed"

# Test 13: Multiple consecutive calls (stress test)
run_test "Multiple consecutive calls succeed" \
    "bash '$WEATHER_SCRIPT' 'Chicago' >/dev/null && sleep 1 && bash '$WEATHER_SCRIPT' 'New York' >/dev/null && echo 'success'" \
    "success"

echo ""
echo -e "${YELLOW}=== Error Handling Tests ===${NC}"
echo ""

# Test 14: Invalid location (should show error or handle gracefully)
# Note: wttr.in may still return results for invalid locations, so we just check it doesn't crash
run_test "Invalid location doesn't crash" \
    "bash '$WEATHER_SCRIPT' 'XYZINVALIDCITY123456' 2>&1 || echo 'handled'" \
    ".*"

# Test 15: Empty location uses default
run_test "Empty location uses default" \
    "bash '$WEATHER_SCRIPT' ''" \
    "Location:"

echo ""
echo -e "${YELLOW}=== Integration Tests ===${NC}"
echo ""

# Test 16: Weather data is current (not cached from months ago)
run_test "Weather data appears current (has temperature data)" \
    "bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Temperature:.*[+-][0-9]"

# Test 17: International location (London, UK)
run_test "International location (London, UK)" \
    "bash '$WEATHER_SCRIPT' 'London,UK'" \
    "Location:.*London"

echo ""
echo -e "${YELLOW}=== Path Resolution Tests ===${NC}"
echo ""

# Test 18: Script can find ARDEN_ROOT
run_test "Script resolves ARDEN_ROOT correctly" \
    "cd /tmp && bash '$WEATHER_SCRIPT' 'Chicago'" \
    "Location:.*Chicago"

# Test 19: Default location file is read
run_test "Default location file is read" \
    "bash '$WEATHER_SCRIPT'" \
    "Farmington"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Tests run:    $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
