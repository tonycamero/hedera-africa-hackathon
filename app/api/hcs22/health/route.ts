import { NextRequest, NextResponse } from 'next/server';
import { getHealthMetrics } from '@/lib/hcs22/health';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hcs22/health
 * Returns HCS-22 health metrics for monitoring
 */
export async function GET(req: NextRequest) {
  try {
    const metrics = getHealthMetrics();
    
    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[HCS22 Health] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Health check failed' 
      },
      { status: 500 }
    );
  }
}
