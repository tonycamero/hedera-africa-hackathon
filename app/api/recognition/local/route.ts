import { NextRequest, NextResponse } from 'next/server';
import { recognitionSignals, getSignalsByCategory, getSignalCounts } from '@/lib/data/recognitionSignals';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'social' | 'academic' | 'professional' | null;
    const stats = searchParams.get('stats') === 'true';
    
    console.log('[Local Recognition API] Request params:', { category, stats });
    
    // Return statistics if requested
    if (stats) {
      const counts = getSignalCounts();
      const stats = {
        total: recognitionSignals.length,
        categories: counts,
        rarities: {
          'Common': recognitionSignals.filter(s => s.rarity === 'Common').length,
          'Uncommon': recognitionSignals.filter(s => s.rarity === 'Uncommon').length,
          'Rare': recognitionSignals.filter(s => s.rarity === 'Rare').length,
          'Epic': recognitionSignals.filter(s => s.rarity === 'Epic').length,
          'Legendary': recognitionSignals.filter(s => s.rarity === 'Legendary').length
        }
      };
      
      return NextResponse.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    }
    
    // Filter by category if specified
    const data = category ? getSignalsByCategory(category) : recognitionSignals;
    
    console.log(`[Local Recognition API] Serving ${data.length} recognition signals`);
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      category: category || 'all',
      source: 'local_recognition_signals',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Local Recognition API] Failed to serve local recognition data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to serve local recognition data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}