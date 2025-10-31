import { NextRequest, NextResponse } from "next/server"
import { Transaction, PublicKey } from "@hashgraph/sdk"
import { getHederaClient } from "@/lib/hedera/serverClient"

/**
 * Submit a user-signed Hedera transaction
 * Client signs frozen tx with Magic -> server just executes it
 * No signature manipulation on server -> avoids "signature array mismatch"
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { signedTransactionBase64, transactionType } = body

    console.log(`[Hedera Submit] Submitting ${transactionType || 'transaction'}`)
    console.log(`[Hedera Submit] signedTx length: ${signedTransactionBase64?.length || 0}`)

    if (!signedTransactionBase64) {
      return NextResponse.json({
        ok: false,
        error: "Missing signedTransactionBase64"
      }, { status: 400 })
    }

    // Get Hedera client
    const client = await getHederaClient()
    
    // Deserialize complete signed transaction from client
    const signedBytes = Buffer.from(signedTransactionBase64, 'base64')
    
    console.log(`[Hedera Submit] Deserializing signed transaction (${signedBytes.length} bytes)...`)
    const tx = Transaction.fromBytes(signedBytes)
    console.log(`[Hedera Submit] Transaction type: ${tx.constructor.name}`)
    console.log(`[Hedera Submit] Transaction ID: ${tx.transactionId?.toString()}`)

    // Execute signed transaction
    console.log(`[Hedera Submit] Executing transaction...`)
    const response = await tx.execute(client)
    const receipt = await response.getReceipt(client)

    console.log(`[Hedera Submit] ✅ Success: ${response.transactionId.toString()}`)
    console.log(`[Hedera Submit] Status: ${receipt.status.toString()}`)

    return NextResponse.json({
      ok: true,
      transactionId: response.transactionId.toString(),
      status: receipt.status.toString()
    })

  } catch (error: any) {
    console.error('[Hedera Submit] Transaction failed:', error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "Transaction submission failed"
    }, { status: 500 })
  }
}
