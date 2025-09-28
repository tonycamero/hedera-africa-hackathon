// app/api/debug-direct-recognition/route.ts
import { NextResponse } from "next/server"
import { directHCSRecognitionService } from "@/lib/services/DirectHCSRecognitionService"
import { getSessionId } from "@/lib/session"

export async function GET() {
  try {
    const sessionId = getSessionId()
    
    // Initialize the service
    await directHCSRecognitionService.initialize()
    
    // Get debug info
    const debugInfo = directHCSRecognitionService.getDebugInfo()
    
    // Get all definitions
    const allDefinitions = directHCSRecognitionService.getAllDefinitions()
    
    // Get user instances
    const userInstances = directHCSRecognitionService.getUserInstances(sessionId)
    
    // Get all instances for comparison
    const allInstances = directHCSRecognitionService.getAllInstances()
    
    return NextResponse.json({
      status: 'success',
      sessionId,
      debugInfo,
      definitions: {
        count: allDefinitions.length,
        samples: allDefinitions.slice(0, 5).map(def => ({
          id: def.id,
          name: def.name,
          category: def.category,
          rarity: def.rarity,
          icon: def.icon
        }))
      },
      instances: {
        userCount: userInstances.length,
        totalCount: allInstances.length,
        userInstances: userInstances.map(inst => ({
          id: inst.id,
          definitionId: inst.definitionId,
          issuer: inst.issuer,
          note: inst.note
        })),
        allUsers: [...new Set(allInstances.map(inst => inst.owner))]
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}