import { NextRequest, NextResponse } from 'next/server'
import { hcsRecognitionService } from '@/lib/services/HCSRecognitionService'

export async function POST(req: NextRequest) {
  try {
    console.log('[Debug] Clearing HCS recognition cache...')
    
    // Dispose and clear the existing service
    hcsRecognitionService.dispose()
    
    // Force re-initialization to pick up latest HCS data
    await hcsRecognitionService.initialize()
    
    // Get fresh data
    const definitions = hcsRecognitionService.getAllDefinitions()
    const debugInfo = hcsRecognitionService.getDebugInfo()
    
    console.log('[Debug] Cache refreshed successfully')
    
    return NextResponse.json({
      ok: true,
      message: 'HCS recognition cache refreshed',
      stats: {
        definitionsCount: definitions.length,
        enhancedCount: definitions.filter(d => d.enhancementVersion).length,
        categoryCounts: {
          social: definitions.filter(d => d.category === 'social').length,
          academic: definitions.filter(d => d.category === 'academic').length,
          professional: definitions.filter(d => d.category === 'professional').length
        }
      },
      debugInfo,
      sampleEnhanced: definitions
        .filter(d => d.enhancementVersion)
        .slice(0, 3)
        .map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          rarity: d.rarity,
          hasExtended: !!d.extendedDescription,
          hasStats: !!d.stats,
          hasTraits: !!d.traits,
          enhancementVersion: d.enhancementVersion
        }))
    })
    
  } catch (error: any) {
    console.error('[Debug] Error refreshing recognition cache:', error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to refresh cache',
      message: 'Cache refresh failed'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const definitions = hcsRecognitionService.getAllDefinitions()
    const debugInfo = hcsRecognitionService.getDebugInfo()
    
    return NextResponse.json({
      ok: true,
      stats: {
        definitionsCount: definitions.length,
        enhancedCount: definitions.filter(d => d.enhancementVersion).length,
        categoryCounts: {
          social: definitions.filter(d => d.category === 'social').length,
          academic: definitions.filter(d => d.category === 'academic').length,
          professional: definitions.filter(d => d.category === 'professional').length
        }
      },
      debugInfo,
      sampleDefinitions: definitions.slice(0, 5).map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        rarity: d.rarity,
        hasExtended: !!d.extendedDescription,
        hasStats: !!d.stats,
        enhancementVersion: d.enhancementVersion
      }))
    })
    
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to get cache info'
    }, { status: 500 })
  }
}