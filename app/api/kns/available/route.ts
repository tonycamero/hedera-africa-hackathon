// app/api/kns/available/route.ts
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

async function checkNameAvailability(name: string): Promise<boolean> {
  const url = `${KNS_API_URL}/name/${encodeURIComponent(name)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(url, { 
      headers: HEADERS, 
      signal: controller.signal 
    });
    
    // If 404, the name is available
    if (response.status === 404) {
      return true;
    }
    
    // If 200, the name is taken
    if (response.ok) {
      return false;
    }
    
    // Other errors
    throw new Error(`KNS API error: ${response.status} ${response.statusText}`);
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
    const cacheKey = `available:${normalizedName}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedResult = cache.get(cacheKey);
      console.log(`[KNS Available] Cache hit for ${normalizedName}`);
      return NextResponse.json(cachedResult);
    }

    console.log(`[KNS Available] Checking availability: ${normalizedName}`);
    
    // Check availability via KNS API
    const available = await checkNameAvailability(normalizedName);
    const result = { 
      available,
      name: normalizedName,
      cached: false,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    cache.set(cacheKey, result);
    
    console.log(`[KNS Available] ${normalizedName} is ${available ? 'AVAILABLE' : 'TAKEN'}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[KNS Available] Error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'KNS availability check timeout', message: 'Request timed out after 5 seconds' }, 
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'KNS availability check failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 502 }
    );
  }
}