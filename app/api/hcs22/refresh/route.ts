import { NextResponse } from 'next/server';

/**
 * Manual HCS-22 cache refresh endpoint
 * Triggers an incremental fetch of new identity bindings
 */
export async function POST() {
  try {
    const { refreshBindings } = await import('@/lib/server/hcs22/init');
    
    // Trigger refresh (non-blocking)
    refreshBindings().catch(err => {
      console.error('[HCS22 Refresh API] Refresh failed:', err);
    });
    
    return NextResponse.json({
      ok: true,
      message: 'HCS-22 refresh triggered'
    });
  } catch (error: any) {
    console.error('[HCS22 Refresh API] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
