# Weather Skill Tests

Automated test suite for the ARDEN weather skill to ensure reliability and catch breaking changes.

## Test Files

- `test-get-weather.sh` - Main test suite for the get-weather.sh script

## Running Tests

### Run all tests:
```bash
cd /home/hal/ARDEN/skills/weather/tests
./test-get-weather.sh
```

### Run from anywhere:
```bash
bash /home/hal/ARDEN/skills/weather/tests/test-get-weather.sh
```

## Test Categories

### 1. Basic Functionality Tests
- Script existence and executability
- Default location handling
- City and state queries
- Zip code queries
- Different city lookups

### 2. Output Format Tests
- Temperature field presence
- Condition field presence
- Humidity field presence
- Wind field presence
- Recommendation presence
- Temperature unit (°F) validation

### 3. Performance Tests
- Response time (< 8 seconds)
- Multiple consecutive calls
- Stress testing

### 4. Error Handling Tests
- Invalid location handling
- Empty location fallback
- Graceful degradation

### 5. Integration Tests
- Real API calls to wttr.in
- Current weather data validation
- International locations
- Data freshness checks

### 6. Path Resolution Tests
- ARDEN_ROOT detection
- Default location file reading
- Script portability

## Test Output

Tests provide colored output:
- 🟢 **GREEN** - Test passed
- 🔴 **RED** - Test failed
- 🟡 **YELLOW** - Test section headers
- 🔵 **BLUE** - Test suite headers

Example output:
```
========================================
Weather Script Test Suite
========================================

=== Basic Functionality Tests ===

Test 1: Script exists and is executable ... PASSED
Test 2: Default location (Farmington, AR) ... PASSED
Test 3: City and state (Farmington, AR) ... PASSED

...

========================================
Test Summary
========================================

Tests run:    19
Tests passed: 19
Tests failed: 0

✓ All tests passed!
```

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```bash
# In your CI script
cd /home/hal/ARDEN/skills/weather/tests
./test-get-weather.sh || exit 1
```

## Adding New Tests

To add a new test, use the helper functions:

### Positive Test (should succeed):
```bash
run_test "Test name" \
    "command to run" \
    "expected output pattern"
```

### Negative Test (should fail):
```bash
run_negative_test "Test name" \
    "command to run" \
    "expected error pattern"
```

## Requirements

- bash
- curl (for API calls)
- timeout command (coreutils)
- grep (for pattern matching)

## Notes

- Tests make real API calls to wttr.in
- Some tests may be slower depending on network conditions
- Tests have a 15-second timeout to prevent hanging
- Color output works best in terminals that support ANSI colors

## Troubleshooting

### Tests timeout
- Check internet connection
- Check if wttr.in is accessible: `curl https://wttr.in`
- Increase timeout in test script if needed

### Tests fail intermittently
- wttr.in API may be rate-limiting
- Add delay between tests if needed
- Check if API response format has changed

### All tests fail
- Verify weather script path: `/home/hal/ARDEN/skills/weather/tools/get-weather.sh`
- Check script is executable: `chmod +x get-weather.sh`
- Run script manually to debug: `bash get-weather.sh Chicago`

## Maintenance

Update tests when:
- Weather script functionality changes
- New features are added
- Output format changes
- API endpoints change
- Error handling is modified

## Future Enhancements

Potential test improvements:
- [ ] Mock wttr.in API for offline testing
- [ ] Test forecast functionality when enabled
- [ ] Test different temperature units
- [ ] Test weather alerts
- [ ] Performance benchmarking
- [ ] Test caching if implemented
- [ ] Test rate limiting handling
