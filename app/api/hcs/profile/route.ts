import { NextRequest, NextResponse } from "next/server"
import { parseHrl } from "@/lib/utils/hrl"
import { Client, PrivateKey, TopicMessageSubmitTransaction } from "@hashgraph/sdk"
import { ensureHbar } from "@/lib/services/hbarGuardrail"
import { logTxServer } from "@/lib/telemetry/txLog"
import { hasSufficientTRST, recordTRSTDebit } from "@/lib/services/trstBalanceService"
import { TRST_PRICING } from "@/lib/config/pricing"
import { topics } from "@/lib/registry/serverRegistry"
import { invalidateProfileCache } from "@/lib/server/profile/normalizer"

const MIRROR_BASE = process.env.HEDERA_MIRROR_BASE || "https://testnet.mirrornode.hedera.com"

// Hedera operator configuration
const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID || process.env.NEXT_PUBLIC_HEDERA_OPERATOR_ID
const OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || "testnet"

export async function GET(req: NextRequest) {
  try {
    const hrl = req.nextUrl.searchParams.get("hrl")
    if (!hrl) {
      return NextResponse.json({ 
        ok: false, 
        error: "missing hrl parameter" 
      }, { status: 400 })
    }

    const { topic, seq } = parseHrl(hrl)

    // Fetch from Hedera Mirror Node
    const url = `${MIRROR_BASE}/api/v1/topics/${topic}/messages/${seq}`
    console.log(`[HCS Profile] Fetching: ${url}`)
    
    const response = await fetch(url, { 
      cache: "no-store",
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Mirror Node responded with ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const base64Message = data?.message
    
    if (!base64Message) {
      throw new Error("No message content found")
    }

    // Decode base64 message
    const messageJson = JSON.parse(Buffer.from(base64Message, "base64").toString("utf8"))
    
    // Extract profile from the PROFILE_UPDATE payload
    const profile = messageJson?.payload || messageJson

    console.log(`[HCS Profile] Successfully fetched profile for HRL: ${hrl}`)

    return NextResponse.json({ 
      ok: true, 
      profile,
      hrl,
      source: "mirror_node"
    })

  } catch (error: any) {
    console.warn(`[HCS Profile] Error fetching profile:`, error.message)
    
    // Return error without fallback
    const hrl = req.nextUrl.searchParams.get("hrl")
    
    return NextResponse.json({ 
      ok: false,
      error: error.message || "Failed to fetch profile",
      hrl,
      source: "error"
    }, { status: 404 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accountId, displayName, bio, avatar, signature, publicKey, timestamp } = body

    if (!accountId) {
      return NextResponse.json({ 
        ok: false, 
        error: "missing accountId" 
      }, { status: 400 })
    }

    // Check if payload is signed (client-side signing for user autonomy)
    const isSignedPayload = signature && publicKey && timestamp
    
    if (!isSignedPayload) {
      return NextResponse.json({ 
        ok: false, 
        error: "Profile must be signed by user's Hedera key. Use lib/hedera/signProfile.ts" 
      }, { status: 400 })
    }

    if (!OPERATOR_ID || !OPERATOR_KEY) {
      throw new Error("Hedera operator credentials not configured")
    }

    // Initialize Hedera client
    const client = HEDERA_NETWORK === "mainnet" 
      ? Client.forMainnet() 
      : Client.forTestnet()

    // Parse operator key (handle hex format with 0x prefix)
    const operatorKey = OPERATOR_KEY.startsWith("0x")
      ? PrivateKey.fromStringECDSA(OPERATOR_KEY.slice(2))
      : PrivateKey.fromString(OPERATOR_KEY)

    client.setOperator(OPERATOR_ID, operatorKey)

    // TRST Fee Check: Ensure sufficient TRST balance
    const profileCost = TRST_PRICING.PROFILE_UPDATE
    const trstCheck = await hasSufficientTRST(accountId, profileCost)
    
    if (!trstCheck.sufficient) {
      client.close()
      return NextResponse.json({ 
        ok: false, 
        error: 'insufficient_trst',
        details: `Profile update costs ${profileCost} TRST. You have ${trstCheck.current.toFixed(2)} TRST.`,
        cost: profileCost,
        balance: trstCheck.current
      }, { status: 402 })
    }
    
    console.log(`[HCS Profile POST] TRST balance check passed: ${trstCheck.current} >= ${profileCost}`)

    // HBAR Guardrail: Ensure sufficient balance before transaction
    try {
      await ensureHbar(OPERATOR_ID, 0.01)
    } catch (balanceError: any) {
      console.error('[HCS Profile POST] HBAR guardrail failed:', balanceError.message)
      client.close()
      return NextResponse.json({ 
        ok: false, 
        error: `Insufficient HBAR balance: ${balanceError.message}` 
      }, { status: 402 })
    }

    // Build PROFILE_UPDATE message payload (includes signature for verification)
    const profilePayload = {
      type: "PROFILE_UPDATE",
      accountId,
      displayName: displayName || "",
      bio: bio || "",
      avatar: avatar || "",
      timestamp, // Use client-provided timestamp (part of signed message)
      signature, // User's signature proves ownership
      publicKey  // User's public key for verification
    }

    const PROFILE_TOPIC_ID = topics().profile
    console.log(`[HCS Profile POST] Submitting signed profile for ${accountId} to topic ${PROFILE_TOPIC_ID}`)
    console.log(`[HCS Profile POST] Signature: ${signature.slice(0, 16)}...`)
    console.log(`[HCS Profile POST] Public Key: ${publicKey}`)

    // Submit to HCS topic
    const transaction = new TopicMessageSubmitTransaction({
      topicId: PROFILE_TOPIC_ID,
      message: JSON.stringify(profilePayload)
    })

    const txResponse = await transaction.execute(client)
    const receipt = await txResponse.getReceipt(client)

    console.log(`[HCS Profile POST] Success - Status: ${receipt.status}, Seq: ${receipt.topicSequenceNumber}`)

    // Log transaction for telemetry
    const txId = txResponse.transactionId.toString()
    logTxServer({
      action: "PROFILE_UPDATE",
      accountId,
      txId,
      topicId: PROFILE_TOPIC_ID,
      status: "SUCCESS"
    })
    
    // Record TRST debit
    recordTRSTDebit(accountId, profileCost, 'PROFILE_UPDATE', txId)

    // Construct HRL for the created profile
    const hrl = `hcs://${HEDERA_NETWORK}/${PROFILE_TOPIC_ID}/${receipt.topicSequenceNumber}`

    // Invalidate profile cache so next fetch gets fresh data
    invalidateProfileCache(accountId)
    console.log(`[HCS Profile POST] Invalidated cache for ${accountId}`)

    // Trigger HCS-22 refresh to pick up any new identity bindings
    try {
      const { refreshBindings } = await import('@/lib/server/hcs22/init');
      refreshBindings().catch(err => console.error('[HCS Profile POST] Background refresh failed:', err));
    } catch (e) {
      // Non-blocking
    }

    client.close()

    return NextResponse.json({
      ok: true,
      hrl,
      profile: profilePayload,
      transactionId: txId,
      sequenceNumber: receipt.topicSequenceNumber?.toString()
    })

  } catch (error: any) {
    console.error(`[HCS Profile POST] Error creating profile:`, error.message)
    
    // Log failed transaction
    if (accountId) {
      logTxServer({
        action: "PROFILE_UPDATE",
        accountId,
        status: "ERROR",
        meta: { error: error.message }
      })
    }
    
    return NextResponse.json({ 
      ok: false,
      error: error.message || "Failed to create profile"
    }, { status: 500 })
  }
}
