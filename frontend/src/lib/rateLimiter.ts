interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private getKey(identifier: string): string {
    return `rate_limit_${identifier}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (record.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }

  canMakeRequest(identifier: string = "default"): boolean {
    const key = this.getKey(identifier);
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || record.resetTime < now) {
      // Create new window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.options.windowMs,
      });
      return true;
    }

    if (record.count >= this.options.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string = "default"): number {
    const key = this.getKey(identifier);
    const record = this.requests.get(key);
    const now = Date.now();

    if (!record || record.resetTime < now) {
      return this.options.maxRequests;
    }

    return Math.max(0, this.options.maxRequests - record.count);
  }

  getResetTime(identifier: string = "default"): number {
    const key = this.getKey(identifier);
    const record = this.requests.get(key);
    return record?.resetTime || Date.now() + this.options.windowMs;
  }

  reset(identifier: string = "default"): void {
    const key = this.getKey(identifier);
    this.requests.delete(key);
  }
}

// Create rate limiters for different endpoints
export const authRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 requests
  windowMs: 60000, // per minute
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60000, // per minute
});

export default RateLimiter;
