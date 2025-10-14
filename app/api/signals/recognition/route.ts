// API endpoint for enriched recognition signals
import { NextRequest, NextResponse } from 'next/server';
import { mapRarityToCanonical, type CanonicalRarity } from '@/lib/rarity/canonical-rarity';

// Helper functions for enrichment
function generateEnrichedLabels(name: string, description: string, category: string): string[] {
  const labels: string[] = [];
  
  // Base label from name
  labels.push(name.toLowerCase().replace(/\s+/g, '-'));
  
  // Category-specific labels
  if (category === 'social') labels.push('social-dynamics');
  if (category === 'academic') labels.push('academic-achievement');
  if (category === 'professional') labels.push('workplace-skills');
  
  // Content-based labels
  if (description.includes('confidence')) labels.push('confidence');
  if (description.includes('smooth')) labels.push('charisma');
  if (description.includes('energy')) labels.push('positive-energy');
  if (description.includes('problem')) labels.push('problem-solving');
  if (description.includes('code')) labels.push('technical');
  if (description.includes('network')) labels.push('networking');
  
  // Special cases
  if (name.toLowerCase().includes('goat')) labels.push('legendary', 'excellence');
  if (name.toLowerCase().includes('rizz')) labels.push('charisma', 'social-skills');
  
  return [...new Set(labels)].slice(0, 6); // Remove duplicates, limit to 6
}

function generateContentHash(signalId: string): string {
  // Simple deterministic hash based on signal ID
  let hash = 0;
  const str = `recognition-${signalId}-v1`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

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
    
    // Get raw signals and enrich them manually since service has issues
    const rawResponse = await fetch(`${baseUrl}/api/recognition`);
    
    if (!rawResponse.ok) {
      throw new Error(`Recognition API failed: ${rawResponse.status}`);
    }
    
    const rawResult = await rawResponse.json();
    if (!rawResult.success || !rawResult.data) {
      throw new Error('Invalid recognition API response');
    }
    
    // Enrich the raw signals
    const enrichedSignals = rawResult.data.map((signal: any) => ({
      type_id: `${signal.id}@1`,
      base_id: signal.id,
      version: 1,
      category: signal.category,
      name: signal.name,
      description: signal.description,
      labels: generateEnrichedLabels(signal.name, signal.description, signal.category),
      rarity: mapRarityToCanonical(signal.rarity),
      icon: signal.icon,
      content_hash: generateContentHash(signal.id),
      created_at: signal._ts,
      source: 'recognition_signals',
      metadata: {
        original_rarity: signal.rarity,
        hrl: signal._hrl,
        timestamp: signal._ts
      }
    }));
    
    return NextResponse.json({
      success: true,
      data: enrichedSignals,
      count: enrichedSignals.length,
      source: 'recognition_enrichment_api',
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