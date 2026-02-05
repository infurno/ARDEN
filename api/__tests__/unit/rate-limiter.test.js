/**
 * Rate Limiter Unit Tests
 */

const RateLimiter = require('../../utils/rate-limiter');

describe('RateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(60000, 5); // 5 requests per minute
  });

  afterEach(() => {
    rateLimiter.clear();
  });

  describe('Constructor', () => {
    test('should create rate limiter with default values', () => {
      const limiter = new RateLimiter();
      expect(limiter.windowMs).toBe(60000);
      expect(limiter.maxRequests).toBe(10);
    });

    test('should create rate limiter with custom values', () => {
      const limiter = new RateLimiter(30000, 3);
      expect(limiter.windowMs).toBe(30000);
      expect(limiter.maxRequests).toBe(3);
    });
  });

  describe('check()', () => {
    test('should allow first request', () => {
      const result = rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    test('should track multiple requests from same user', () => {
      rateLimiter.check('user1'); // 1st request
      rateLimiter.check('user1'); // 2nd request
      const result = rateLimiter.check('user1'); // 3rd request
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    test('should block requests after limit exceeded', () => {
      // Make 5 requests (max limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.check('user1');
      }
      
      // 6th request should be blocked
      const result = rateLimiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.waitTime).toBeGreaterThan(0);
    });

    test('should track different users separately', () => {
      rateLimiter.check('user1');
      rateLimiter.check('user1');
      
      const user2Result = rateLimiter.check('user2');
      expect(user2Result.allowed).toBe(true);
      expect(user2Result.remaining).toBe(4); // Fresh counter for user2
    });

    test('should reset after time window expires', () => {
      jest.useFakeTimers();
      
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check('user1');
      }
      
      // Should be blocked
      expect(rateLimiter.check('user1').allowed).toBe(false);
      
      // Advance time by 61 seconds (past the window)
      jest.advanceTimersByTime(61000);
      
      // Should be allowed again
      const result = rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      
      jest.useRealTimers();
    });
  });

  describe('getStatus()', () => {
    test('should return null for user with no requests', () => {
      const status = rateLimiter.getStatus('user1');
      expect(status).toBeNull();
    });

    test('should return status for user with requests', () => {
      rateLimiter.check('user1');
      rateLimiter.check('user1');
      
      const status = rateLimiter.getStatus('user1');
      expect(status).not.toBeNull();
      expect(status.count).toBe(2);
      expect(status.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('reset()', () => {
    test('should reset limit for specific user', () => {
      rateLimiter.check('user1');
      rateLimiter.check('user1');
      
      rateLimiter.reset('user1');
      
      const result = rateLimiter.check('user1');
      expect(result.remaining).toBe(4); // Back to full limit
    });

    test('should only reset specified user', () => {
      rateLimiter.check('user1');
      rateLimiter.check('user2');
      
      rateLimiter.reset('user1');
      
      expect(rateLimiter.getStatus('user1')).toBeNull();
      expect(rateLimiter.getStatus('user2')).not.toBeNull();
    });
  });

  describe('clear()', () => {
    test('should clear all rate limits', () => {
      rateLimiter.check('user1');
      rateLimiter.check('user2');
      rateLimiter.check('user3');
      
      rateLimiter.clear();
      
      expect(rateLimiter.getStatus('user1')).toBeNull();
      expect(rateLimiter.getStatus('user2')).toBeNull();
      expect(rateLimiter.getStatus('user3')).toBeNull();
    });
  });
});
