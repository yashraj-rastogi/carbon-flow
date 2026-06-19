/**
 * In-memory rate limiting utility.
 * Note: For a production application running on serverless infrastructure,
 * an external state store like Redis (e.g., @upstash/ratelimit) is required
 * since memory state resets between function invocations. This serves as an MVP
 * demonstration of security posture.
 *
 * @module lib/rate-limit
 */

interface RateLimiterOptions {
  interval: number; // in milliseconds
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private interval: number;
  private limit: number;

  constructor(options: RateLimiterOptions) {
    this.interval = options.interval;
    this.limit = options.limit;
  }

  /**
   * Checks if a key (e.g. user ID) has exceeded the rate limit.
   *
   * @param key - The unique identifier to limit (e.g., IP address or User ID)
   * @returns An object containing success boolean and remaining tokens
   */
  public limitCheck(key: string): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    // If no record or past reset time, reset counter
    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.interval });
      return { success: true, remaining: this.limit - 1 };
    }

    // If under limit, increment
    if (record.count < this.limit) {
      record.count += 1;
      return { success: true, remaining: this.limit - record.count };
    }

    // Rate limited
    return { success: false, remaining: 0 };
  }
}
