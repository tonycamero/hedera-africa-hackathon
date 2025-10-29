import { NextRequest, NextResponse } from "next/server"
import { submitToTopic } from "@/lib/hedera/serverClient"
import { topics } from "@/lib/registry/serverRegistry"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { realm_id, type, data } = body

    if (!realm_id || !type || !data) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: realm_id, type, data"
      }, { status: 400 })
    }

    // Create system message envelope
    const systemMessage = {
      v: 1,
      realm_id,
      family: "system",
      subtype: type,
      timestamp: new Date().toISOString(),
      data
    }

    console.log(`[HCS System] Writing system message: ${type}`)

    // Submit to HCS System topic (uses signal topic per registry)
    const SYSTEM_TOPIC = topics().system
    if (process.env.NEXT_PUBLIC_HCS_ENABLED === "true") {
      const result = await submitToTopic(
        SYSTEM_TOPIC, 
        JSON.stringify(systemMessage)
      )
      const messageId = result.transactionId
      
      console.log(`[HCS System] Successfully published: ${type} (Message ID: ${messageId})`)
      
      return NextResponse.json({
        ok: true,
        type,
        realm_id,
        messageId,
        status: "published",
        hrl: `hcs://${SYSTEM_TOPIC}/${messageId}`,
        message: "System message published to HCS",
        topic: SYSTEM_TOPIC
      })
    } else {
      // Fallback for demo mode
      console.log(`[HCS System] Demo mode - would publish: ${type}`)
      
      return NextResponse.json({
        ok: true,
        type,
        realm_id,
        messageId: `demo-${Date.now()}`,
        status: "local",
        hrl: `hcs://${SYSTEM_TOPIC}/demo-${type}`,
        message: "System message created locally (HCS disabled)",
        topic: SYSTEM_TOPIC
      })
    }

  } catch (error: any) {
    console.error(`[HCS System] Error publishing system message:`, error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Failed to publish system message",
      message: "System message operation failed"
    }, { status: 500 })
  }
}

// GET endpoint to query system messages (for testing)
export async function GET(req: NextRequest) {
  try {
    const messageType = req.nextUrl.searchParams.get("type")
    const realmId = req.nextUrl.searchParams.get("realm_id")
    
    console.log(`[HCS System] Would query topic ${SYSTEM_TOPIC} for system messages`)
    
    return NextResponse.json({
      ok: true,
      topic: SYSTEM_TOPIC,
      type: messageType,
      realm_id: realmId,
      message: "In production, this would query the HCS topic for system messages",
      status: "query_placeholder"
    })

  } catch (error: any) {
    console.error(`[HCS System] Error retrieving system messages:`, error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Failed to retrieve system messages"
    }, { status: 500 })
  }
}