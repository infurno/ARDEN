# ARDEN Testing Guide

## Overview

ARDEN uses **Jest** as its testing framework with comprehensive unit and integration tests.

## Test Structure

```
api/
├── __tests__/
│   ├── setup.js                 # Test environment configuration
│   ├── sanity.test.js          # Basic Jest functionality tests
│   ├── unit/                   # Unit tests for individual modules
│   │   ├── rate-limiter.test.js
│   │   └── config-validator.test.js
│   ├── integration/            # Integration tests
│   │   └── system-setup.test.js
│   └── fixtures/               # Test data and helpers
│       └── index.js
└── utils/                      # Utility modules (testable)
    ├── rate-limiter.js
    └── config-validator.js
```

## Running Tests

### Run All Tests
```bash
cd api
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Coverage

Current coverage (as of latest run):

| Metric | Coverage |
|--------|----------|
| Statements | 92.3% |
| Branches | 95.31% |
| Functions | 80% |
| Lines | 92.3% |

## Writing Tests

### Unit Test Example

```javascript
const RateLimiter = require('../../utils/rate-limiter');

describe('RateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(60000, 5);
  });

  test('should allow first request', () => {
    const result = rateLimiter.check('user1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
```

### Integration Test Example

```javascript
describe('Integration: System Setup', () => {
  test('should validate complete setup flow', () => {
    const configValid = validateConfig(MOCK_CONFIG);
    const envValidation = validateEnvironment(env, MOCK_CONFIG);
    
    expect(configValid).toBe(true);
    expect(envValidation.valid).toBe(true);
  });
});
```

## Test Categories

### Unit Tests
- **Rate Limiter** (`rate-limiter.test.js`): 12 tests
  - Constructor validation
  - Request limiting logic
  - Reset functionality
  - Multi-user tracking

- **Config Validator** (`config-validator.test.js`): 17 tests
  - Configuration structure validation
  - Environment variable validation
  - Provider-specific requirements
  - Sanitized environment info

### Integration Tests
- **System Setup** (`system-setup.test.js`): 4 tests
  - Rate limiter + config validator interaction
  - Complete setup flow validation
  - Graceful failure handling

## Mock Data

Test fixtures are available in `__tests__/fixtures/index.js`:

```javascript
const { MOCK_CONFIG, createMockAudioFile } = require('../fixtures');

// Use in tests
test('should work with mock config', () => {
  validateConfig(MOCK_CONFIG);
});
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
   ```javascript
   test('should do something', () => {
     // Arrange
     const limiter = new RateLimiter();
     
     // Act
     const result = limiter.check('user1');
     
     // Assert
     expect(result.allowed).toBe(true);
   });
   ```

2. **Use descriptive test names**: Start with "should"
   - ✅ `should allow first request`
   - ❌ `test1`

3. **One assertion concept per test**: Test one thing at a time

4. **Clean up after tests**: Use `afterEach()` for cleanup
   ```javascript
   afterEach(() => {
     rateLimiter.clear();
   });
   ```

5. **Use mocks for external dependencies**: Don't make real API calls in tests

## Continuous Integration

To add CI/CD:

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd api && npm install
      - run: cd api && npm test
      - run: cd api && npm run test:coverage
```

## Future Tests to Add

- [ ] Voice processing (STT/TTS) with mocked providers
- [ ] AI provider integrations (mocked API calls)
- [ ] Telegram bot message handling
- [ ] File cleanup and session logging
- [ ] Error recovery scenarios
- [ ] Performance/load tests for rate limiter

## Troubleshooting

### Tests failing with "MODULE_NOT_FOUND"
- Ensure you're running tests from the `api/` directory
- Check that all dependencies are installed: `npm install`

### Coverage not showing all files
- Update `collectCoverageFrom` in `package.json`

### Mock not working
- Ensure mocks are defined before imports
- Use `jest.mock()` at the top of test files

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
