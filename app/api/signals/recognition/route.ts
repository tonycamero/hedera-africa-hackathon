// API endpoint for enriched recognition signals
import { NextRequest, NextResponse } from 'next/server';
import { recognitionEnrichmentService } from '@/lib/services/RecognitionEnrichmentService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'social' | 'academic' | 'professional' | null;
    const rarity = searchParams.get('rarity');
    const stats = searchParams.get('stats') === 'true';
    
    console.log('[Enriched Signals API] Request params:', { category, rarity, stats });
    
    // Return statistics if requested
    if (stats) {
      const statistics = await recognitionEnrichmentService.getEnrichmentStats();
      return NextResponse.json({
        success: true,
        stats: statistics,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get signals by category if specified
    if (category) {
      const signals = await recognitionEnrichmentService.getSignalsByCategory(category);
      return NextResponse.json({
        success: true,
        data: signals,
        count: signals.length,
        category,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get signals by rarity if specified
    if (rarity) {
      const signals = await recognitionEnrichmentService.getSignalsByRarity(rarity as any);
      return NextResponse.json({
        success: true,
        data: signals,
        count: signals.length,
        rarity,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get all enriched signals
    const allSignals = await recognitionEnrichmentService.enrichAllSignals();
    
    return NextResponse.json({
      success: true,
      data: allSignals,
      count: allSignals.length,
      source: 'recognition_enrichment',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Enriched Signals API] Failed to fetch enriched recognition signals:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch enriched recognition signals',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}