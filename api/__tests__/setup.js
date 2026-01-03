/**
 * Jest Test Setup
 * 
 * This file runs before all tests to set up the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'test-token-123456';
process.env.AI_PROVIDER = 'ollama';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Set longer timeout for tests that might involve file I/O
jest.setTimeout(10000);
