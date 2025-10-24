/**
 * Simple in-memory rate limiter for TrustMesh v2
 * In production, use Redis or dedicated rate limiting service
 */

interface RateRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private records = new Map<string, RateRecord>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup expired records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  checkLimit(key: string): boolean {
    const now = Date.now();
    const record = this.records.get(key);

    // No record or expired window - allow and reset
    if (!record || now >= record.resetTime) {
      this.records.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    // Within window - check count
    if (record.count >= this.maxRequests) {
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const record = this.records.get(key);
    if (!record || Date.now() >= record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(key: string): number {
    const record = this.records.get(key);
    if (!record || Date.now() >= record.resetTime) {
      return Date.now() + this.windowMs;
    }
    return record.resetTime;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records) {
      if (now >= record.resetTime) {
        this.records.delete(key);
      }
    }
  }

  // Reset all limits (useful for testing)
  reset(): void {
    this.records.clear();
  }
}