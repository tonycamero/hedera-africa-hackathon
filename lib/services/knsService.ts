// lib/services/knsService.ts
export const KNS_DOMAIN_SUFFIX = process.env.NEXT_PUBLIC_KNS_DOMAIN_SUFFIX || '.hbar';
export const KNS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_KNS === 'true';

// In-memory cache for client-side caching
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const DEFAULT_TTL = 60000; // 60 seconds client-side cache

export interface KNSResolveResult {
  accountId: string | null;
  name: string;
  cached: boolean;
  timestamp: string;
}

export interface KNSReverseResult {
  name: string | null;
  accountId: string;
  cached: boolean;
  timestamp: string;
}

export interface KNSAvailableResult {
  available: boolean;
  name: string;
  cached: boolean;
  timestamp: string;
}

/**
 * Normalize a name for KNS lookup
 * - Remove leading @ symbol
 * - Convert to lowercase
 * - Add .hbar suffix if not present
 * - Apply NFKC normalization
 */
function normalizeName(name: string): string {
  const nfkc = name.normalize?.('NFKC') ?? name;
  const clean = nfkc.trim().toLowerCase().replace(/^@/, '');
  return clean.endsWith(KNS_DOMAIN_SUFFIX) ? clean : `${clean}${KNS_DOMAIN_SUFFIX}`;
}

/**
 * Generic fetch with timeout and error handling
 */
async function fetchWithTimeout<T>(url: string, timeoutMs: number = 5000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get cached result if valid, otherwise return null
 */
function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Store result in cache
 */
function setCached<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

export const knsService = {
  /**
   * Format a name according to KNS conventions
   */
  formatName: normalizeName,
  
  /**
   * Check if KNS is enabled
   */
  isEnabled(): boolean {
    return KNS_ENABLED;
  },
  
  /**
   * Resolve a name to an account ID
   */
  async resolveName(name: string): Promise<string | null> {
    if (!KNS_ENABLED) {
      throw new Error('KNS service is disabled');
    }
    
    const normalizedName = normalizeName(name);
    const cacheKey = `resolve:${normalizedName}`;
    
    // Check client cache first
    const cached = getCached<KNSResolveResult>(cacheKey);
    if (cached) {
      console.log(`[KNS Service] Client cache hit for resolve: ${normalizedName}`);
      return cached.accountId;
    }
    
    try {
      console.log(`[KNS Service] Resolving name: ${normalizedName}`);
      const result = await fetchWithTimeout<KNSResolveResult>(`/api/kns/resolve?name=${encodeURIComponent(normalizedName)}`);
      
      // Cache the result
      setCached(cacheKey, result);
      
      console.log(`[KNS Service] Resolved ${normalizedName} → ${result.accountId || 'NOT_FOUND'}`);
      return result.accountId;
      
    } catch (error) {
      console.error(`[KNS Service] Failed to resolve ${normalizedName}:`, error);
      throw new Error(`Failed to resolve name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  /**
   * Try to resolve a string as either a name or account ID
   * Returns { type: 'name' | 'account', value: string, resolved?: string }
   */
  async resolveIdentifier(input: string): Promise<{ 
    type: 'name' | 'account'; 
    value: string; 
    resolved?: string;
    displayName?: string; 
  }> {
    const trimmed = input.trim();
    
    // Check if it looks like an account ID (0.0.xxxxx format)
    if (trimmed.match(/^0\.0\.\d+$/)) {
      // It's an account ID - return as-is for now (reverse lookup can be added later)
      return {
        type: 'account',
        value: trimmed
      };
    }
    
    // Otherwise treat it as a name and try to resolve
    try {
      const accountId = await this.resolveName(trimmed);
      return {
        type: 'name',
        value: normalizeName(trimmed),
        resolved: accountId || undefined
      };
    } catch {
      // Resolution failed
      return {
        type: 'name',
        value: normalizeName(trimmed)
      };
    }
  },
  
  /**
   * Clear client-side cache
   */
  clearCache(): void {
    cache.clear();
    console.log('[KNS Service] Client cache cleared');
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }
};