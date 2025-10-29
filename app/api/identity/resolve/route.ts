// app/api/identity/resolve/route.ts
// HCS-22 Identity Resolution Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { Magic } from '@magic-sdk/admin';
import { resolveHederaAccountId } from '../../../../lib/server/hcs22/resolver';

const magic = new Magic(process.env.MAGIC_SECRET_KEY!);

// Simple rate limiting: issuer -> { count, window_start }
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per issuer

/**
 * Validate issuer format (did:ethr:0x...)
 */
function isValidIssuer(issuer: string): boolean {
  return /^did:ethr:(0x)?[0-9a-f]{40}$/i.test(issuer);
}

/**
 * Check rate limit for an issuer
 */
function checkRateLimit(issuer: string): boolean {
  const now = Date.now();
  const key = issuer.toLowerCase();
  
  const limit = rateLimits.get(key);
  
  // Reset window if expired
  if (!limit || now - limit.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  // Check if over limit
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  // Increment count
  limit.count++;
  return true;
}

/**
 * POST /api/identity/resolve
 * 
 * Resolve Hedera Account ID from Magic issuer (DID)
 * Requires Magic authentication
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Magic DID token
    const auth = req.headers.get('Authorization') || '';
    const didToken = auth.replace(/^Bearer\s+/i, '');
    
    if (!didToken) {
      console.warn('[HCS22 API] Missing auth token');
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    
    try {
      await magic.token.validate(didToken);
    } catch (authError: any) {
      console.warn('[HCS22 API] Invalid auth token:', authError.message);
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }
    
    // 2. Parse and validate request body
    const body = await req.json();
    const { issuer } = body;
    
    if (!issuer) {
      return NextResponse.json({ error: 'Missing issuer' }, { status: 400 });
    }
    
    if (!isValidIssuer(issuer)) {
      console.warn('[HCS22 API] Invalid issuer format:', issuer);
      return NextResponse.json({ error: 'Invalid issuer format (expected did:ethr:0x...)' }, { status: 400 });
    }
    
    // 3. Rate limiting
    if (!checkRateLimit(issuer)) {
      console.warn('[HCS22 API] Rate limit exceeded for:', issuer);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // 4. Resolve account ID
    console.log('[HCS22 API] Resolving issuer:', issuer);
    const accountId = await resolveHederaAccountId(issuer);
    
    if (accountId) {
      console.log('[HCS22 API] Resolved:', issuer, '→', accountId);
      return NextResponse.json({
        success: true,
        accountId,
        source: 'hcs22_resolver',
      });
    } else {
      console.log('[HCS22 API] No account found for:', issuer);
      return NextResponse.json({
        success: true,
        accountId: null,
        source: 'hcs22_resolver',
        message: 'Account not found. Provision required.',
      });
    }
  } catch (error: any) {
    console.error('[HCS22 API] Resolve error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve identity' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/identity/resolve?issuer=did:ethr:0x...
 * 
 * Alternative GET endpoint for simple lookups (no auth required for reads)
 * Useful for public verification
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const issuer = searchParams.get('issuer');
    
    if (!issuer) {
      return NextResponse.json({ error: 'Missing issuer query parameter' }, { status: 400 });
    }
    
    if (!isValidIssuer(issuer)) {
      return NextResponse.json({ error: 'Invalid issuer format' }, { status: 400 });
    }
    
    // Rate limiting
    if (!checkRateLimit(issuer)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    const accountId = await resolveHederaAccountId(issuer);
    
    return NextResponse.json({
      success: true,
      accountId,
      source: 'hcs22_resolver',
    });
  } catch (error: any) {
    console.error('[HCS22 API GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
