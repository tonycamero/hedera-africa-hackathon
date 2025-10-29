import { NextRequest, NextResponse } from "next/server"
import { submitToTopic } from "@/lib/hedera/serverClient"
import { hasSufficientTRST, recordTRSTDebit } from "@/lib/services/trstBalanceService"
import { getTRSTCost } from "@/lib/config/pricing"
import { verifyRecognitionSignature, type SignedRecognitionPayload } from "@/lib/hedera/signRecognition"
import { topics } from "@/lib/registry/serverRegistry"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      tokenId, 
      name, 
      category, 
      subtitle, 
      emoji, 
      issuerId, 
      recipientId,
      trustAmount = 0,
      message = "",
      signature,
      publicKey,
      timestamp
    } = body

    if (!tokenId || !name || !category || !issuerId || !recipientId) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: tokenId, name, category, issuerId, recipientId"
      }, { status: 400 })
    }

    // Check if payload is signed (required for user autonomy)
    const isSignedPayload = signature && publicKey && timestamp
    
    if (!isSignedPayload) {
      return NextResponse.json({ 
        ok: false, 
        error: "Recognition must be signed by user's Hedera key. Use lib/hedera/signRecognition.ts" 
      }, { status: 400 })
    }

    // Verify signature
    const signedPayload: SignedRecognitionPayload = {
      type: "RECOGNITION_MINT",
      fromAccountId: issuerId,
      toAccountId: recipientId,
      message,
      trustAmount,
      timestamp,
      signature,
      publicKey
    }

    const isValid = verifyRecognitionSignature(signedPayload)
    if (!isValid) {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid signature" 
      }, { status: 401 })
    }

    // Check TRST balance
    const trstCost = getTRSTCost("RECOGNITION_MINT")
    const balanceCheck = await hasSufficientTRST(issuerId, trstCost)
    
    if (!balanceCheck.sufficient) {
      return NextResponse.json({
        ok: false,
        error: `Insufficient TRST balance. Required: ${balanceCheck.required}, Current: ${balanceCheck.current}`
      }, { status: 402 }) // 402 Payment Required
    }

    console.log(`[HCS Mint] User ${issuerId} has sufficient TRST (${balanceCheck.current} >= ${trstCost})`)

    // Get signal topic from registry
    const SIGNAL_TOPIC = topics().signal

    // Create SIGNAL_MINT envelope (hashinal mint) with user signature
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
        message, // User's recognition message
        trustAmount, // Trust allocation amount
        uri: `hcs://11/${SIGNAL_TOPIC}/${Date.now()}`, // Will be updated with actual seq
        metadata: {
          category,
          minted_at: timestamp,
          issuer: issuerId,
          trstCost // Track cost for transparency
        }
      },
      // User's signature proves authorization
      signature,
      publicKey
    }

    console.log(`[HCS Mint] Minting signed recognition: ${name} (${category}) to ${recipientId}`)
    console.log(`[HCS Mint] Signature: ${signature.slice(0, 16)}...`)
    console.log(`[HCS Mint] Trust amount: ${trustAmount}, TRST cost: ${trstCost}`)

    // Submit to HCS SIGNAL topic
    if (!process.env.NEXT_PUBLIC_HCS_ENABLED || !SIGNAL_TOPIC) {
      return NextResponse.json({
        ok: false,
        error: "HCS is not enabled or signal topic not configured"
      }, { status: 503 })
    }
    
    const result = await submitToTopic(SIGNAL_TOPIC, JSON.stringify(envelope))
    
    // Record TRST debit after successful HCS submission
    const debitRecord = recordTRSTDebit(
      issuerId,
      trstCost,
      `RECOGNITION_MINT:${tokenId}`,
      result.transactionId
    )
    
    console.log(`[HCS Mint] Successfully minted hashinal: ${tokenId}`)
    console.log(`[HCS Mint] Debited ${trstCost} TRST from ${issuerId}`)
    
    return NextResponse.json({
      ok: true,
      tokenId,
      name,
      category,
      status: "onchain",
      hrl: `hcs://11/${SIGNAL_TOPIC}/pending`, // Real seq would be returned from HCS
      message: "Recognition signal minted successfully on HCS",
      trstCharged: trstCost,
      trstBalance: balanceCheck.current - trstCost,
      transactionId: result.transactionId
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