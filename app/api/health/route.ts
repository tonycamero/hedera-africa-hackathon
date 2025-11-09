// app/api/health/route.ts
// Main health check endpoint with HCS-22 status
import { NextResponse } from 'next/server';
import { getBindingStats } from '../../../lib/server/hcs22/reducer';
import { getResolverStats } from '../../../lib/server/hcs22/resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * 
 * System health check including HCS-22 status
 */
export async function GET() {
  try {
    const hcs22Enabled = process.env.HCS22_ENABLED === 'true';
    const hcs22TopicId = process.env.HCS22_IDENTITY_TOPIC_ID;
    
    // Get HCS-22 stats if enabled
    let hcs22Status = null;
    if (hcs22Enabled) {
      const bindingStats = getBindingStats();
      const resolverStats = getResolverStats();
      
      hcs22Status = {
        enabled: true,
        topic: hcs22TopicId || null,
        bindings: bindingStats,
        resolver: resolverStats,
      };
    } else {
      hcs22Status = {
        enabled: false,
        topic: null,
        message: 'HCS-22 is disabled. Set HCS22_ENABLED=true to enable.',
      };
    }
    
    // Basic system health
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        network: process.env.HEDERA_NETWORK || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'unknown',
      },
      hcs22: hcs22Status,
    };
    
    return NextResponse.json(health);
  } catch (error: any) {
    console.error('[Health] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}
