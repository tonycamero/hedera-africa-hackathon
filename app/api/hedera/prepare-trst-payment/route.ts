import { NextRequest, NextResponse } from "next/server"
import { TransferTransaction, TokenId, AccountId, TransactionId } from "@hashgraph/sdk"
import { getHederaClient } from "@/lib/hedera/serverClient"

const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID || "0.0.5361653"
const TREASURY_ACCOUNT = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_ID || "0.0.5864559"

/**
 * Prepare a frozen TRST payment transaction for client-side signing
 * 
 * Flow:
 * 1. Server creates and freezes transaction
 * 2. Client signs frozen transaction with Magic
 * 3. Client submits signed transaction to /api/hedera/submit-transaction
 */
export async function POST(req: NextRequest) {
  try {
    const { from, amount } = await req.json()

    if (!from || !amount) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: from, amount"
      }, { status: 400 })
    }

    console.log(`[TRST Prepare] Preparing payment: ${amount} tiny units from ${from} to ${TREASURY_ACCOUNT}`)

    // Get Hedera client
    const client = await getHederaClient()

    // Parse account IDs and token ID
    const fromAccount = AccountId.fromString(from)
    const treasuryAccount = AccountId.fromString(TREASURY_ACCOUNT)
    const tokenId = TokenId.fromString(TRST_TOKEN_ID)

    // Build token transfer transaction
    // Set user as the transaction fee payer (they pay for their own transaction)
    // IMPORTANT: Use single node to avoid "signature array mismatch" with Magic signing
    const nodeAccountIds = client._network.network // Get network nodes
    const firstNodeId = Object.values(nodeAccountIds)[0] as any
    
    console.log(`[TRST Prepare] Freezing with single node: ${firstNodeId?.toString() || 'unknown'}`)
    
    const tx = await new TransferTransaction()
      .addTokenTransfer(tokenId, fromAccount, -amount)
      .addTokenTransfer(tokenId, treasuryAccount, amount)
      .setTransactionId(TransactionId.generate(fromAccount)) // User pays fees
      .setNodeAccountIds([firstNodeId]) // Single node = single signature required
      .freezeWith(client) // Freeze with server's client settings

    console.log(`[TRST Prepare] Transaction frozen, serializing for client signature...`)

    // Serialize frozen transaction
    const txBytes = tx.toBytes()
    const base64Tx = Buffer.from(txBytes).toString('base64')

    console.log(`[TRST Prepare] Transaction prepared successfully`)

    return NextResponse.json({
      ok: true,
      transactionBytes: base64Tx,
      details: {
        from: fromAccount.toString(),
        to: treasuryAccount.toString(),
        token: tokenId.toString(),
        amount
      }
    })

  } catch (error: any) {
    console.error('[TRST Prepare] Error preparing transaction:', error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Failed to prepare TRST payment transaction"
    }, { status: 500 })
  }
}
