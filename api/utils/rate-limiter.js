/**
 * Rate Limiting Module
 * 
 * Provides per-user rate limiting functionality
 */

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.limitMap = new Map(); // userId -> { count, resetTime }
  }

  /**
   * Check if user has exceeded rate limit
   * @param {number|string} userId - User identifier
   * @returns {Object} - { allowed: boolean, remaining: number, waitTime?: number }
   */
  check(userId) {
    const now = Date.now();
    const userLimit = this.limitMap.get(userId);

    // If no record or window expired, create new record
    if (!userLimit || now > userLimit.resetTime) {
      this.limitMap.set(userId, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    // Check if limit exceeded
    if (userLimit.count >= this.maxRequests) {
      const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        waitTime
      };
    }

    // Increment counter
    userLimit.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - userLimit.count
    };
  }

  /**
   * Get current limit status for a user
   * @param {number|string} userId - User identifier
   * @returns {Object} - { count: number, resetTime: number } or null
   */
  getStatus(userId) {
    return this.limitMap.get(userId) || null;
  }

  /**
   * Reset rate limit for a specific user
   * @param {number|string} userId - User identifier
   */
  reset(userId) {
    this.limitMap.delete(userId);
  }

  /**
   * Clear all rate limits
   */
  clear() {
    this.limitMap.clear();
  }
}

/**
 * Helper function for simple rate limiting
 * @param {number|string} userId - User identifier
 * @param {Map} rateLimitMap - Map to store rate limit data
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests per window
 * @returns {Object} - { allowed: boolean, remaining: number, waitTime?: number }
 */
function checkRateLimit(userId, rateLimitMap, windowMs = 60000, maxRequests = 10) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  // If no record or window expired, create new record
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Check if limit exceeded
  if (userLimit.count >= maxRequests) {
    const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      waitTime
    };
  }

  // Increment counter
  userLimit.count++;
  return {
    allowed: true,
    remaining: maxRequests - userLimit.count
  };
}

module.exports = RateLimiter;
module.exports.checkRateLimit = checkRateLimit;
