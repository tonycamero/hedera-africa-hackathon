import { NextRequest, NextResponse } from "next/server"
import { submitToTopic } from "@/lib/hedera/serverClient"
import { topics } from "@/lib/registry/serverRegistry"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: type, data"
      }, { status: 400 })
    }

    if (type !== 'definition') {
      return NextResponse.json({
        ok: false,
        error: "Only 'definition' type is supported by this endpoint"
      }, { status: 400 })
    }

    // Validate required definition fields
    const { id, name, category } = data
    if (!id || !name || !category) {
      return NextResponse.json({
        ok: false,
        error: "Missing required definition fields: id, name, category"
      }, { status: 400 })
    }

    // Create enhanced recognition definition message
    const enhancedDefinition = {
      type: 'recognition_definition_created',
      schema: 'HCS-Recognition-Def@2', // Version 2 with enhanced metadata
      timestamp: new Date().toISOString(),
      data: {
        // Core identification
        id: data.id,
        slug: data.slug || data.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        
        // Categorization
        category: data.category,
        number: data.number,
        isActive: data.isActive ?? true,
        
        // Enhanced metadata (if provided)
        extendedDescription: data.extendedDescription,
        rarity: data.rarity,
        
        // Rich stats (if provided)
        stats: data.stats,
        
        // Trait categories (if provided)
        traits: data.traits,
        
        // External resources (if provided)
        relatedLinks: data.relatedLinks,
        
        // Narrative elements (if provided)
        backstory: data.backstory,
        tips: data.tips,
        
        // System metadata
        enhancementVersion: '2.0',
        enhancedAt: new Date().toISOString(),
        source: data.source || 'api_request'
      }
    }

    console.log(`[HCS Definition] Publishing enhanced definition: ${data.name} (${data.id})`)

    // Get recognition topic from registry
    const RECOGNITION_TOPIC = topics().recognition

    // Submit to HCS Recognition topic
    if (process.env.NEXT_PUBLIC_HCS_ENABLED === "true") {
      const result = await submitToTopic(
        RECOGNITION_TOPIC, 
        JSON.stringify(enhancedDefinition)
      )
      const messageId = result.transactionId
      
      console.log(`[HCS Definition] Successfully published: ${data.id} (Message ID: ${messageId})`)
      
      return NextResponse.json({
        ok: true,
        id: data.id,
        name: data.name,
        category: data.category,
        messageId,
        status: "published",
        hrl: `hcs://${RECOGNITION_TOPIC}/${messageId}`,
        message: "Enhanced recognition definition published to HCS",
        enhancementVersion: '2.0'
      })
    } else {
      // Fallback for demo mode
      console.log(`[HCS Definition] Demo mode - would publish: ${data.id}`)
      
      return NextResponse.json({
        ok: true,
        id: data.id,
        name: data.name,
        category: data.category,
        messageId: `demo-${Date.now()}`,
        status: "local",
        hrl: `hcs://${RECOGNITION_TOPIC}/demo-${data.id}`,
        message: "Enhanced recognition definition created locally (HCS disabled)",
        enhancementVersion: '2.0'
      })
    }

  } catch (error: any) {
    console.error(`[HCS Definition] Error publishing recognition definition:`, error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Failed to publish recognition definition",
      message: "Publish operation failed"
    }, { status: 500 })
  }
}

// GET endpoint to retrieve published definitions (for testing)
export async function GET(req: NextRequest) {
  try {
    const definitionId = req.nextUrl.searchParams.get("id")
    
    if (!definitionId) {
      return NextResponse.json({
        ok: false,
        error: "Missing id parameter"
      }, { status: 400 })
    }

    console.log(`[HCS Definition] Would query topic for definition: ${definitionId}`)
    
    return NextResponse.json({
      ok: true,
      id: definitionId,
      topic: RECOGNITION_TOPIC,
      message: "In production, this would query the HCS topic for the specific definition",
      status: "query_placeholder"
    })

  } catch (error: any) {
    console.error(`[HCS Definition] Error retrieving definition:`, error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Failed to retrieve definition data"
    }, { status: 500 })
  }
}