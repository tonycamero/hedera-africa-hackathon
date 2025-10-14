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
    
    // Get base URL from request headers
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Return statistics if requested
    if (stats) {
      try {
        // Fetch recognition data directly here for stats
        const response = await fetch(`${baseUrl}/api/recognition`);
        if (!response.ok) {
          throw new Error(`Recognition API failed: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error('Invalid recognition API response');
        }
        
        // Calculate stats from the data
        const data = result.data;
        const stats = {
          total: data.length,
          categories: {
            social: data.filter((s: any) => s.category === 'social').length,
            academic: data.filter((s: any) => s.category === 'academic').length,
            professional: data.filter((s: any) => s.category === 'professional').length
          },
          rarities: {
            Regular: data.filter((s: any) => s.rarity === 'Common').length,
            Heat: data.filter((s: any) => s.rarity === 'Rare').length,
            Peak: 0,
            'God-Tier': data.filter((s: any) => s.rarity === 'Legendary').length
          },
          averageLabelsPerSignal: 4 // Estimated based on enrichment logic
        };
        
        return NextResponse.json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[Enriched Signals API] Failed to calculate stats:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to calculate enrichment stats',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
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