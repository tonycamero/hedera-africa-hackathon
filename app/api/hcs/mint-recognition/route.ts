import { NextRequest, NextResponse } from "next/server"
import { submitToTopic } from "@/lib/hedera/serverClient"

const SIGNAL_TOPIC = process.env.NEXT_PUBLIC_TOPIC_SIGNAL || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tokenId, name, category, subtitle, emoji, issuerId, recipientId } = body

    if (!tokenId || !name || !category || !issuerId || !recipientId) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: tokenId, name, category, issuerId, recipientId"
      }, { status: 400 })
    }

    // Create SIGNAL_MINT envelope (hashinal mint)
    const envelope = {
      type: "SIGNAL_MINT",
      from: issuerId,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: {
        tokenId,
        name,
        kind: category, // social, academic, professional  
        subtitle,
        emoji,
        to: recipientId,
        uri: `hcs://11/${SIGNAL_TOPIC}/${Date.now()}`, // Will be updated with actual seq
        metadata: {
          category,
          minted_at: new Date().toISOString(),
          issuer: issuerId
        }
      },
      // In production, add signature here
    }

    console.log(`[HCS Mint] Minting recognition signal: ${name} (${category}) to ${recipientId}`)

    // Submit to HCS SIGNAL topic
    if (!process.env.NEXT_PUBLIC_HCS_ENABLED || !SIGNAL_TOPIC) {
      return NextResponse.json({
        ok: false,
        error: "HCS is not enabled or signal topic not configured"
      }, { status: 503 })
    }
    
    const result = await submitToTopic(SIGNAL_TOPIC, JSON.stringify(envelope))
    
    console.log(`[HCS Mint] Successfully minted hashinal: ${tokenId}`)
    
    return NextResponse.json({
      ok: true,
      tokenId,
      name,
      category,
      status: "onchain",
      hrl: `hcs://11/${SIGNAL_TOPIC}/pending`, // Real seq would be returned from HCS
      message: "Recognition signal minted successfully on HCS"
    })

  } catch (error: any) {
    console.error(`[HCS Mint] Error minting recognition signal:`, error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Failed to mint recognition signal",
      message: "Mint operation failed"
    }, { status: 500 })
  }
}

// GET endpoint to retrieve hashinal ownership via replay
export async function GET(req: NextRequest) {
  try {
    const tokenId = req.nextUrl.searchParams.get("tokenId")
    
    if (!tokenId) {
      return NextResponse.json({
        ok: false,
        error: "Missing tokenId parameter"
      }, { status: 400 })
    }

    // TODO: Implement topic replay to determine current ownership
    // This would replay the SIGNAL topic to process SIGNAL_MINT and SIGNAL_TRANSFER messages
    console.log(`[HCS Mint] Topic replay not yet implemented for: ${tokenId}`)
    
    return NextResponse.json({
      ok: false,
      error: "Topic replay feature not yet implemented",
      tokenId
    }, { status: 501 })

  } catch (error: any) {
    console.error(`[HCS Mint] Error retrieving hashinal:`, error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Failed to retrieve hashinal data"
    }, { status: 500 })
  }
}