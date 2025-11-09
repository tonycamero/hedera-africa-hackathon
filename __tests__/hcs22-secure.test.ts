/**
 * HCS-22 Secure Dual-Key Integration Tests
 * 
 * Test Matrix:
 * - Login (ASSERT): emits IDENTITY_ASSERTION, 200, no PII
 * - Accept Stipend (BIND): creates 1 account, emits IDENTITY_BIND
 * - Re-login new browser: no new account (resolver hits cache)
 * - Concurrent requests: lock prevents duplicate accounts
 * - HCS disabled: login succeeds, no emits
 * - PII guard: email-style DIDs blocked
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getCanonicalDid, validateNoPII, assertSafeForHCS } from '@/lib/util/getCanonicalDid';
import { withIdentityLock, isLocked, forceReleaseLock } from '@/lib/util/withIdentityLock';

describe('HCS-22 Security Guards', () => {
  describe('PII Protection', () => {
    it('should block email addresses', () => {
      expect(validateNoPII('user@example.com')).toBe(false);
      expect(validateNoPII('did:ethr:user@example.com')).toBe(false);
    });

    it('should block domain patterns', () => {
      expect(validateNoPII('did:ethr:test.com')).toBe(false);
      expect(validateNoPII('mysite.io')).toBe(false);
    });

    it('should block phone numbers', () => {
      expect(validateNoPII('1234567890')).toBe(false);
      expect(validateNoPII('did:ethr:15551234567')).toBe(false);
    });

    it('should allow valid hex DIDs', () => {
      expect(validateNoPII('did:ethr:0xabc123def456')).toBe(true);
      expect(validateNoPII('0xabc123')).toBe(true);
    });

    it('should throw on PII in assertSafeForHCS', () => {
      expect(() => assertSafeForHCS('user@test.com')).toThrow(/SECURITY.*PII/);
    });
  });

  describe('Canonical DID Derivation', () => {
    it('should preserve valid did:ethr:0x format', () => {
      const input = 'did:ethr:0xabc123def456';
      expect(getCanonicalDid(input)).toBe(input);
    });

    it('should hash email-based DIDs', () => {
      const input = 'did:ethr:user@example.com';
      const result = getCanonicalDid(input);
      
      expect(result).toMatch(/^did:ethr:0x[a-f0-9]{40}$/);
      expect(result).not.toContain('@');
      expect(result).not.toContain('example.com');
    });

    it('should hash raw email addresses', () => {
      const input = 'user@example.com';
      const result = getCanonicalDid(input);
      
      expect(result).toMatch(/^did:ethr:0x[a-f0-9]{40}$/);
      expect(result).not.toContain('@');
    });

    it('should be deterministic (same input → same output)', () => {
      const email = 'test@example.com';
      const did1 = getCanonicalDid(email);
      const did2 = getCanonicalDid(email);
      
      expect(did1).toBe(did2);
    });

    it('should add did:ethr prefix to bare hex addresses', () => {
      const input = '0xabc123def456789012345678901234567890';
      const result = getCanonicalDid(input);
      
      expect(result).toBe('did:ethr:0xabc123def456789012345678901234567890');
    });
  });

  describe('Idempotency Locks', () => {
    const testDid = 'did:ethr:0xtest123';

    afterEach(() => {
      // Clean up locks after each test
      forceReleaseLock(testDid);
    });

    it('should acquire and release lock successfully', async () => {
      let executed = false;
      
      await withIdentityLock(testDid, async () => {
        executed = true;
        expect(isLocked(testDid)).toBe(true);
      });
      
      expect(executed).toBe(true);
      expect(isLocked(testDid)).toBe(false);
    });

    it('should prevent concurrent execution', async () => {
      const results: string[] = [];
      
      const promise1 = withIdentityLock(testDid, async () => {
        results.push('first-start');
        await new Promise(resolve => setTimeout(resolve, 100));
        results.push('first-end');
      });
      
      // Try to acquire same lock while first is held
      const promise2 = withIdentityLock(testDid, async () => {
        results.push('second');
      }).catch(err => {
        results.push('second-blocked');
        return err;
      });
      
      await Promise.all([promise1, promise2]);
      
      expect(results).toEqual(['first-start', 'second-blocked', 'first-end']);
    });

    it('should release lock on error', async () => {
      try {
        await withIdentityLock(testDid, async () => {
          throw new Error('Test error');
        });
      } catch (err) {
        // Expected
      }
      
      // Lock should be released
      expect(isLocked(testDid)).toBe(false);
    });

    it('should expire locks after TTL', async () => {
      await withIdentityLock(testDid, async () => {
        // Hold lock briefly
      }, 100); // 100ms TTL
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(isLocked(testDid)).toBe(false);
    });
  });
});

describe('HCS-22 API Endpoints', () => {
  const mockToken = createMockMagicToken('did:ethr:0xabc123');
  
  describe('POST /api/hcs22/resolve (ASSERT mode)', () => {
    it('should require authentication', async () => {
      const res = await fetch('http://localhost:3000/api/hcs22/resolve?mode=ASSERT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(res.status).toBe(401);
    });

    it('should reject invalid mode', async () => {
      const res = await fetch('http://localhost:3000/api/hcs22/resolve?mode=INVALID', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid mode');
    });

    it('should publish IDENTITY_ASSERTION', async () => {
      const res = await fetch('http://localhost:3000/api/hcs22/resolve?mode=ASSERT', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data.success).toBe(true);
      expect(data.mode).toBe('ASSERT');
      expect(data.identityDid).toMatch(/^did:ethr:0x/);
      expect(data.hederaAccountId).toBeNull();
    });
  });

  describe('POST /api/hcs22/resolve (BIND mode)', () => {
    it('should resolve or provision account', async () => {
      const res = await fetch('http://localhost:3000/api/hcs22/resolve?mode=BIND', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data.success).toBe(true);
      expect(data.mode).toBe('BIND');
      expect(data.identityDid).toMatch(/^did:ethr:0x/);
      expect(data.hederaAccountId).toMatch(/^0\.0\.\d+$/);
      expect(data.resolutionSource).toMatch(/cache|reducer|mirror|provisioned/);
    });

    it('should be idempotent (same DID → same account)', async () => {
      // First BIND
      const res1 = await fetch('http://localhost:3000/api/hcs22/resolve?mode=BIND', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      const data1 = await res1.json();
      
      // Second BIND (should return same account)
      const res2 = await fetch('http://localhost:3000/api/hcs22/resolve?mode=BIND', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      const data2 = await res2.json();
      
      expect(data1.hederaAccountId).toBe(data2.hederaAccountId);
      expect(data2.resolutionSource).toBe('cache'); // Second request hits cache
    });
  });

  describe('GET /api/hcs22/resolve', () => {
    it('should require did parameter', async () => {
      const res = await fetch('http://localhost:3000/api/hcs22/resolve');
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('did query parameter required');
    });

    it('should validate DID for PII', async () => {
      const res = await fetch('http://localhost:3000/api/hcs22/resolve?did=user@test.com');
      
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('PII');
    });

    it('should return cached resolution', async () => {
      const did = 'did:ethr:0xabc123';
      
      const res = await fetch(`http://localhost:3000/api/hcs22/resolve?did=${did}`);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data).toHaveProperty('accountId');
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('updatedAt');
    });
  });

  describe('Feature Flag', () => {
    it('should no-op when HCS22_ENABLED=false', async () => {
      // Save original env
      const originalEnv = process.env.HCS22_ENABLED;
      process.env.HCS22_ENABLED = 'false';
      
      const res = await fetch('http://localhost:3000/api/hcs22/resolve?mode=ASSERT', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      
      expect(res.status).toBe(204);
      const data = await res.json();
      expect(data.disabled).toBe(true);
      
      // Restore env
      process.env.HCS22_ENABLED = originalEnv;
    });
  });
});

/**
 * Helper: Create mock Magic ID token for testing
 */
function createMockMagicToken(issuer: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: issuer,
    sub: issuer,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const signature = 'mock-signature';
  
  return `${header}.${payload}.${signature}`;
}
