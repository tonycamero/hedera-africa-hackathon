// app/api/debug/recognition/route.ts
import { NextResponse } from 'next/server';
import { directHCSRecognitionService } from '@/lib/services/DirectHCSRecognitionService';

export async function GET() {
  try {
    // Initialize if not already done
    await directHCSRecognitionService.initialize();
    
    const debugInfo = directHCSRecognitionService.getDebugInfo();
    
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...debugInfo
    });
  } catch (error) {
    console.error('[API] /api/debug/recognition error:', error);
    
    // Return debug info even on error for diagnostics
    const debugInfo = directHCSRecognitionService.getDebugInfo();
    
    return NextResponse.json({
      ok: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
      ...debugInfo
    }, { status: 500 });
  }
}

// Support clearing cache for testing
export async function DELETE() {
  try {
    directHCSRecognitionService.clearCache();
    
    return NextResponse.json({
      ok: true,
      message: 'Recognition service cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] /api/debug/recognition DELETE error:', error);
    
    return NextResponse.json({
      ok: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}