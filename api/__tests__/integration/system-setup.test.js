/**
 * Integration Tests for Rate Limiter with Config Validator
 * 
 * Tests how rate limiter and config validator work together
 */

const RateLimiter = require('../../utils/rate-limiter');
const { validateConfig, validateEnvironment } = require('../../utils/config-validator');
const { MOCK_CONFIG } = require('../fixtures');

describe('Integration: Rate Limiter + Config Validator', () => {
  test('should create rate limiter with config-validated settings', () => {
    // Validate config first
    expect(() => validateConfig(MOCK_CONFIG)).not.toThrow();
    
    // Create rate limiter with validated config
    const rateLimiter = new RateLimiter(60000, 10);
    
    // Test that it works
    const result = rateLimiter.check('user1');
    expect(result.allowed).toBe(true);
  });

  test('should handle multiple users with validated configuration', () => {
    // Validate environment
    const env = {
      TELEGRAM_BOT_TOKEN: 'test-token',
      AI_PROVIDER: 'ollama'
    };
    const envValidation = validateEnvironment(env, MOCK_CONFIG);
    expect(envValidation.valid).toBe(true);
    
    // Create rate limiter
    const rateLimiter = new RateLimiter(60000, 5);
    
    // Simulate multiple users
    const users = ['user1', 'user2', 'user3'];
    users.forEach(userId => {
      const result = rateLimiter.check(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  test('should enforce rate limits even with valid config', () => {
    validateConfig(MOCK_CONFIG);
    
    const rateLimiter = new RateLimiter(60000, 3);
    
    // Make 3 requests (max limit)
    for (let i = 0; i < 3; i++) {
      rateLimiter.check('user1');
    }
    
    // 4th request should be blocked
    const result = rateLimiter.check('user1');
    expect(result.allowed).toBe(false);
  });
});

describe('Integration: Environment Validation Flow', () => {
  test('should validate complete setup flow', () => {
    // Step 1: Validate config
    const configValid = validateConfig(MOCK_CONFIG);
    expect(configValid).toBe(true);
    
    // Step 2: Validate environment
    const env = {
      TELEGRAM_BOT_TOKEN: 'test-token',
      AI_PROVIDER: 'ollama',
      OLLAMA_URL: 'http://localhost:11434'
    };
    const envValidation = validateEnvironment(env, MOCK_CONFIG);
    expect(envValidation.valid).toBe(true);
    
    // Step 3: Create rate limiter
    const rateLimiter = new RateLimiter();
    expect(rateLimiter).toBeDefined();
    
    // Step 4: System is ready
    const systemStatus = {
      configValid,
      envValid: envValidation.valid,
      rateLimiterReady: !!rateLimiter
    };
    
    expect(systemStatus.configValid).toBe(true);
    expect(systemStatus.envValid).toBe(true);
    expect(systemStatus.rateLimiterReady).toBe(true);
  });

  test('should fail gracefully with incomplete setup', () => {
    // Missing TELEGRAM_BOT_TOKEN
    const env = {
      AI_PROVIDER: 'openai'
      // Missing OPENAI_API_KEY
    };
    
    const envValidation = validateEnvironment(env, MOCK_CONFIG);
    expect(envValidation.valid).toBe(false);
    expect(envValidation.errors).toHaveLength(2);
    expect(envValidation.errors).toContain('TELEGRAM_BOT_TOKEN environment variable is required');
    expect(envValidation.errors).toContain('OPENAI_API_KEY required when AI_PROVIDER=openai');
  });
});
