import { NextRequest, NextResponse } from 'next/server'
import { SignalTemplateService } from '@/lib/templates/SignalTemplateService'
import { TemplateManager } from '@/lib/templates/TemplateManager'
import { SignalTemplate } from '@/lib/templates/types'

/**
 * GET /api/templates/seasonal
 * 
 * Returns seasonal/event templates based on current active event
 * Query params: lens (optional), event (optional override)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lens = searchParams.get('lens') as any || 'genz'
    const eventOverride = searchParams.get('event')
    
    // Get current active event from environment or override
    const activeEvent = eventOverride || process.env.ACTIVE_EVENT || getCurrentSeason()
    
    console.log(`[SeasonalAPI] Fetching templates for lens: ${lens}, event: ${activeEvent}`)
    
    // Get seasonal templates from manager
    const seasonalTemplates = TemplateManager.getSeasonalTemplates(activeEvent, lens)
    
    // If no seasonal templates, return empty array
    if (seasonalTemplates.length === 0) {
      return NextResponse.json({
        success: true,
        templates: [],
        event: activeEvent,
        message: `No seasonal templates active for event: ${activeEvent}`
      })
    }
    
    return NextResponse.json({
      success: true,
      templates: seasonalTemplates,
      event: activeEvent,
      count: seasonalTemplates.length
    })
    
  } catch (error) {
    console.error('[SeasonalAPI] Error fetching seasonal templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch seasonal templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Determine current season based on date
 */
function getCurrentSeason(): string {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const day = now.getDate()
  
  // Finals season (December 1-20)
  if (month === 12 && day >= 1 && day <= 20) {
    return 'finals_season'
  }
  
  // Graduation season (May-June)
  if (month >= 5 && month <= 6) {
    return 'graduation_season'
  }
  
  // Back to school (August-September)  
  if (month >= 8 && month <= 9) {
    return 'back_to_school'
  }
  
  // Holiday season (November 20 - January 5)
  if ((month === 11 && day >= 20) || month === 12 || (month === 1 && day <= 5)) {
    return 'holiday_season'
  }
  
  // Summer (June 15 - August 15)
  if ((month === 6 && day >= 15) || month === 7 || (month === 8 && day <= 15)) {
    return 'summer_break'
  }
  
  // Default to no special season
  return 'regular'
}