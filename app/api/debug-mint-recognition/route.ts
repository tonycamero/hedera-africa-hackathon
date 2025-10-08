// app/api/debug-mint-recognition/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSessionId } from "@/lib/session"

export async function POST(request: NextRequest) {
  // Production guard - disable demo endpoints
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({
      status: 'disabled',
      message: 'Debug endpoints disabled in production mode'
    }, { status: 403 })
  }
  
  try {
    const body = await request.json()
    const { ownerId = getSessionId(), definitionIds = ['skibidi', 'chad', 'prof-fav'] } = body
    
    // Import HCS services
    const { hcsRecognitionService } = await import('@/lib/services/HCSRecognitionService')
    const { signalsStore } = await import('@/lib/stores/signalsStore')
    
    // Initialize recognition service
    await hcsRecognitionService.initialize()
    
    const mintedInstances = []
    
    for (const defId of definitionIds) {
      try {
        console.log(`[Debug] Minting recognition ${defId} for ${ownerId}`)
        
        // Check if definition exists
        const definition = await hcsRecognitionService.getRecognitionDefinition(defId)
        if (!definition) {
          console.warn(`[Debug] Definition not found: ${defId}`)
          continue
        }
        
        // Create a recognition instance signal directly in the store
        // Since we can't actually mint to HCS from client, we'll simulate it in the store
        const instanceSignal = {
          id: `recognition_${defId}_${ownerId}_${Date.now()}`,
          class: 'recognition' as const,
          topicType: 'SIGNAL' as const,
          direction: 'inbound' as const,
          actors: {
            from: 'demo-issuer',
            to: ownerId
          },
          payload: {
            definitionId: defId,
            definitionSlug: defId,
            definitionName: definition.name,
            definitionIcon: definition.icon,
            note: `Demo minted recognition for ${ownerId}`,
            owner: ownerId,
            issuer: 'demo-issuer'
          },
          ts: Date.now(),
          status: 'onchain' as const,
          type: 'RECOGNITION_MINT',
          meta: {
            tag: 'demo_minted',
            hrl: `recognition/${defId}/${ownerId}/${Date.now()}`
          }
        }
        
        // Add to signals store
        signalsStore.addSignal(instanceSignal)
        
        mintedInstances.push({
          definitionId: defId,
          definitionName: definition.name,
          owner: ownerId,
          signalId: instanceSignal.id
        })
        
        console.log(`[Debug] Successfully minted ${defId} for ${ownerId}`)
        
      } catch (error) {
        console.error(`[Debug] Failed to mint ${defId}:`, error)
      }
    }
    
    // Get updated store state
    const allSignals = signalsStore.getAllSignals()
    const recognitionSignals = allSignals.filter(s => s.class === 'recognition')
    
    return NextResponse.json({
      status: 'success',
      message: `Minted ${mintedInstances.length} recognition instances`,
      mintedInstances,
      totalRecognitionSignals: recognitionSignals.length,
      storeStats: {
        total: allSignals.length,
        byClass: {
          contact: allSignals.filter(s => s.class === 'contact').length,
          trust: allSignals.filter(s => s.class === 'trust').length,
          recognition: recognitionSignals.length,
          system: allSignals.filter(s => s.class === 'system').length
        }
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

export async function GET() {
  // Production guard - disable demo endpoints
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({
      status: 'disabled',
      message: 'Debug endpoints disabled in production mode'
    }, { status: 403 })
  }
  
  try {
    const sessionId = getSessionId()
    
    // Import services
    const { hcsRecognitionService } = await import('@/lib/services/HCSRecognitionService')
    const { signalsStore } = await import('@/lib/stores/signalsStore')
    
    // Check current state
    const allSignals = signalsStore.getAllSignals()
    const recognitionSignals = allSignals.filter(s => s.class === 'recognition')
    const userRecognitionSignals = recognitionSignals.filter(s => s.payload?.owner === sessionId)
    
    // Check if recognition service is initialized
    let serviceState = {}
    try {
      await hcsRecognitionService.initialize()
      serviceState = hcsRecognitionService.getDebugInfo()
    } catch (error) {
      serviceState = { error: error.message }
    }
    
    return NextResponse.json({
      status: 'info',
      sessionId,
      currentState: {
        totalSignals: allSignals.length,
        recognitionSignals: recognitionSignals.length,
        userRecognitionSignals: userRecognitionSignals.length,
        recognitionService: serviceState
      },
      userRecognitions: userRecognitionSignals.map(s => ({
        id: s.id,
        definitionId: s.payload?.definitionId,
        definitionName: s.payload?.definitionName,
        owner: s.payload?.owner,
        issuer: s.payload?.issuer,
        status: s.status,
        ts: new Date(s.ts).toISOString()
      })),
      availableDefinitions: Array.from(hcsRecognitionService.getAllDefinitions?.() || []).map(def => ({
        id: def.id,
        name: def.name,
        slug: def.slug,
        icon: def.icon
      })),
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