import { NextRequest, NextResponse } from 'next/server';
import { incrementPublished, incrementFailed } from '@/lib/hcs22/health';
import { submitToTopic } from '@/lib/hedera/serverClient';
import { requireMagicAuth } from '@/lib/server/auth/requireMagicAuth';
import { getCanonicalDid, assertSafeForHCS } from '@/lib/util/getCanonicalDid';
import { resolveOrProvision } from '@/lib/server/hcs22/resolveOrProvision';

export const dynamic = 'force-dynamic';

/**
 * POST /api/hcs22/resolve
 * Secure Dual-Key Identity Resolution Endpoint
 * 
 * HARD GUARDS:
 * - Requires Magic ID token authentication
 * - Never trusts client-supplied Hedera account IDs
 * - PII-safe: derives canonical DIDs, no emails on-chain
 * - Feature-gated: respects HCS22_ENABLED flag
 * 
 * Modes:
 * - ASSERT (login): Publishes IDENTITY_ASSERTION { identityDid }
 * - BIND (first on-chain action): Resolves/provisions account, publishes IDENTITY_BIND
 * 
 * Flow:
 * 1. Verify Magic token → extract issuer
 * 2. Derive canonical DID (no PII)
 * 3. ASSERT: Publish assertion only
 * 4. BIND: Resolve/provision account → publish binding
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  // HARD GUARD: Feature flag check (non-blocking fallback)
  if (process.env.HCS22_ENABLED !== 'true') {
    console.log('[HCS22] Feature disabled, skipping resolution');
    return NextResponse.json({ success: true, disabled: true }, { status: 200 });
  }
  
  try {
    // HARD GUARD: Require Magic authentication
    const auth = await requireMagicAuth(req);
    
    // Extract mode from query params
    const mode = req.nextUrl.searchParams.get('mode') || 'ASSERT';
    
    if (!['ASSERT', 'BIND'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Use ASSERT or BIND' },
        { status: 400 }
      );
    }
    
    // HARD GUARD: Derive canonical DID from verified issuer (no PII)
    const identityDid = getCanonicalDid(auth.issuer);
    assertSafeForHCS(identityDid);
    
    console.log(`[HCS22 ${mode}] Processing for ${identityDid}`);

    // Get HCS-22 identity topic from environment
    const identityTopicId = process.env.HCS22_IDENTITY_TOPIC_ID;
    if (!identityTopicId) {
      console.error('[HCS22] HCS22_IDENTITY_TOPIC_ID not configured');
      incrementFailed();
      return NextResponse.json(
        { success: false, error: 'Identity topic not configured' },
        { status: 500 }
      );
    }

    let hederaAccountId: string | null = null;
    let resolutionSource: string | undefined;
    
    // BIND mode: Resolve or provision Hedera account (server-side only)
    if (mode === 'BIND') {
      console.log(`[HCS22 BIND] Resolving/provisioning account for ${identityDid}`);
      const resolution = await resolveOrProvision(auth.issuer);
      hederaAccountId = resolution.hederaAccountId;
      resolutionSource = resolution.source;
      console.log(`[HCS22 BIND] Resolved to ${hederaAccountId} (source: ${resolutionSource})`);
    }

    // Create identity event (ASSERT or BIND)
    const identityEvent = {
      type: mode === 'BIND' ? 'IDENTITY_BIND' : 'IDENTITY_ASSERTION',
      version: '1.0.0',
      identityDid,
      hederaAccountId,
      timestamp: new Date().toISOString(),
      assertedBy: 'trustmesh-server',
      metadata: {
        source: 'magic-auth',
        environment: process.env.NODE_ENV || 'development',
        bindingComplete: mode === 'BIND',
        ...(resolutionSource && { resolutionSource })
      }
    };

    // Publish to HCS-22 identity topic
    const result = await submitToTopic(identityTopicId, JSON.stringify(identityEvent));
    
    incrementPublished();
    
    const latency = Date.now() - startTime;
    console.log(`[HCS22 ${mode}] Published to HCS topic ${identityTopicId}, seq=${result.sequenceNumber}, latency=${latency}ms`);

    return NextResponse.json({
      success: true,
      mode,
      identityDid,
      hederaAccountId,
      topicId: identityTopicId,
      sequenceNumber: result.sequenceNumber,
      consensusTimestamp: result.consensusTimestamp,
      latency,
      ...(resolutionSource && { resolutionSource })
    });

  } catch (error: any) {
    incrementFailed();
    console.error('[HCS22] Error:', error);
    
    // Handle auth errors with proper status
    const status = error.status === 401 ? 401 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Resolution failed' 
      },
      { status }
    );
  }
}

/**
 * GET /api/hcs22/resolve?did=<identityDid>
 * Query resolver for DID → Hedera account ID lookup
 * 
 * Flow: cache → reducer → mirror → null
 * No provisioning on GET (read-only)
 */
export async function GET(req: NextRequest) {
  // HARD GUARD: Feature flag check
  if (process.env.HCS22_ENABLED !== 'true') {
    return NextResponse.json({ accountId: null, disabled: true }, { status: 200 });
  }
  
  try {
    const did = req.nextUrl.searchParams.get('did');
    
    if (!did) {
      return NextResponse.json(
        { success: false, error: 'did query parameter required' },
        { status: 400 }
      );
    }
    
    // HARD GUARD: Validate DID is safe (no PII)
    assertSafeForHCS(did);
    
    console.log(`[HCS22 GET] Looking up ${did}`);
    
    // Import resolution helpers
    const { getCacheStats } = await import('@/lib/server/hcs22/resolveOrProvision');
    
    // Check cache first
    const stats = getCacheStats();
    const cached = stats.entries.find(e => e.did === did && !e.expired);
    
    if (cached) {
      console.log(`[HCS22 GET] Cache hit: ${did} → ${cached.accountId}`);
      return NextResponse.json({
        accountId: cached.accountId,
        source: 'cache',
        updatedAt: new Date(Date.now() - cached.ageMs).toISOString()
      });
    }
    
    // TODO: Query HCS reducer + Mirror Node (without provisioning)
    // For now, return null
    console.log(`[HCS22 GET] No resolution found for ${did}`);
    
    return NextResponse.json({
      accountId: null,
      source: 'none',
      updatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[HCS22 GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
