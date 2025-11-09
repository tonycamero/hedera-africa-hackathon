import { NextRequest, NextResponse } from 'next/server'
import { TopicMessageSubmitTransaction, TransferTransaction } from '@hashgraph/sdk'
import { getHederaClient } from '@/lib/hedera/serverClient'
import { requireMagic } from '@/lib/server/auth'
import { getTRSTBalance } from '@/lib/services/trstBalanceService'
import { getTRSTCost } from '@/lib/config/pricing'
import { topics } from '@/lib/registry/serverRegistry'

const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID!
const TREASURY_ACCOUNT_ID = process.env.HEDERA_OPERATOR_ID!

export async function POST(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    
    const body = await req.json()
    const { 
      accountId, 
      tokenId, 
      name, 
      category, 
      subtitle, 
      emoji, 
      recipientId,
      senderName,
      recipientName,
      message = '',
      trustAmount = 0
    } = body
    
    if (!accountId || !tokenId || !name || !category || !recipientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Verify account matches authenticated user
    const { resolveOrProvision } = await import('@/lib/server/hcs22/resolveOrProvision')
    const resolution = await resolveOrProvision(user.issuer)
    
    if (resolution.hederaAccountId !== accountId) {
      return NextResponse.json(
        { error: 'Account ID does not match authenticated user' },
        { status: 403 }
      )
    }
    
    console.log(`[Prepare Mint] Bundling transactions for ${accountId}`)
    
    // Check TRST balance
    const trstCost = getTRSTCost('RECOGNITION_MINT')
    const balance = await getTRSTBalance(accountId)
    
    if (balance.balance < trstCost) {
      return NextResponse.json(
        { 
          error: 'Insufficient TRST balance',
          required: trstCost,
          current: balance.balance
        },
        { status: 402 }
      )
    }
    
    // Get topics
    const SIGNAL_TOPIC = topics().signal
    
    // Build recognition mint message
    const mintPayload = {
      type: 'SIGNAL_MINT',
      from: accountId,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: {
        tokenId,
        name,
        kind: category,
        subtitle,
        emoji,
        to: recipientId,
        senderName,
        recipientName,
        message,
        trustAmount,
        uri: `hcs://11/${SIGNAL_TOPIC}/pending`,
        metadata: {
          category,
          minted_at: Date.now(),
          issuer: accountId,
          trstCost
        }
      }
    }
    
    // Get Hedera client
    const client = await getHederaClient()
    
    // Transaction 1: HCS topic message (recognition mint)
    const mintTx = new TopicMessageSubmitTransaction()
      .setTopicId(SIGNAL_TOPIC)
      .setMessage(JSON.stringify(mintPayload))
      .freezeWith(client)
    
    // Transaction 2: TRST transfer (payment)
    const trstAmountInBaseUnits = Math.floor(trstCost * 1_000_000)
    const paymentTx = new TransferTransaction()
      .addTokenTransfer(TRST_TOKEN_ID, accountId, -trstAmountInBaseUnits)
      .addTokenTransfer(TRST_TOKEN_ID, TREASURY_ACCOUNT_ID, trstAmountInBaseUnits)
      .setTransactionMemo(`TRST: ${tokenId}`)
      .freezeWith(client)
    
    // Bundle both transactions into a single byte array
    // Note: Hedera doesn't have atomic batches, so we serialize both
    // and the client will sign both with one popup
    const bundled = {
      mint: Buffer.from(mintTx.toBytes()).toString('base64'),
      payment: Buffer.from(paymentTx.toBytes()).toString('base64')
    }
    
    console.log(`[Prepare Mint] Prepared bundled transactions`)
    
    return NextResponse.json({
      transactionBytes: JSON.stringify(bundled),
      trstCost,
      currentBalance: balance.balance,
      tokenId
    })
    
  } catch (error: any) {
    console.error('[Prepare Mint] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to prepare mint' },
      { status: 500 }
    )
  }
}
