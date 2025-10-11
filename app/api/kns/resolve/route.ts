// app/api/kns/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Initialize cache with TTL from environment
const cache = new NodeCache({ stdTTL: Number(process.env.CACHE_TTL_SECONDS || 120) });

const KNS_API_URL = process.env.KNS_API_URL || 'https://api.kabuto.sh/v1';
const KNS_API_KEY = process.env.KNS_API_KEY;
const ENABLE_KNS = process.env.ENABLE_KNS === 'true';

const HEADERS = {
  'Content-Type': 'application/json',
  ...(KNS_API_KEY ? { Authorization: `Bearer ${KNS_API_KEY}` } : {}),
};

async function fetchKNS<T>(path: string): Promise<T> {
  const url = `${KNS_API_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(url, { 
      headers: HEADERS, 
      signal: controller.signal 
    });
    
    if (response.status === 404) {
      return null as unknown as T;
    }
    
    if (!response.ok) {
      throw new Error(`KNS API error: ${response.status} ${response.statusText}`);
    }
    
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  if (!ENABLE_KNS) {
    return NextResponse.json(
      { error: 'KNS service is disabled' }, 
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json(
        { error: 'name parameter required' }, 
        { status: 400 }
      );
    }

    const normalizedName = name.toLowerCase().trim();
    const cacheKey = `resolve:${normalizedName}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedResult = cache.get(cacheKey);
      console.log(`[KNS Resolve] Cache hit for ${normalizedName}`);
      return NextResponse.json(cachedResult);
    }

    console.log(`[KNS Resolve] Resolving name: ${normalizedName}`);
    
    // Fetch from KNS API
    const data = await fetchKNS<{ account_id?: string }>(`/name/${encodeURIComponent(normalizedName)}`);
    const result = { 
      accountId: data?.account_id ?? null,
      name: normalizedName,
      cached: false,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    cache.set(cacheKey, result);
    
    console.log(`[KNS Resolve] Resolved ${normalizedName} → ${result.accountId || 'NOT_FOUND'}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[KNS Resolve] Error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'KNS resolve timeout', message: 'Request timed out after 5 seconds' }, 
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'KNS resolve failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 502 }
    );
  }
}