import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = new RateLimiter({ interval: 60000, limit: 3 });
    const key = 'user_123';

    expect(limiter.limitCheck(key).success).toBe(true);
    expect(limiter.limitCheck(key).success).toBe(true);
    expect(limiter.limitCheck(key).success).toBe(true);
  });

  it('blocks requests over the limit', () => {
    const limiter = new RateLimiter({ interval: 60000, limit: 2 });
    const key = 'user_123';

    limiter.limitCheck(key);
    limiter.limitCheck(key);
    
    const result = limiter.limitCheck(key);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets the limit after the interval', () => {
    const limiter = new RateLimiter({ interval: 60000, limit: 1 });
    const key = 'user_123';

    expect(limiter.limitCheck(key).success).toBe(true);
    expect(limiter.limitCheck(key).success).toBe(false);

    // Advance time by 61 seconds
    jest.advanceTimersByTime(61000);

    const result = limiter.limitCheck(key);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });
});
