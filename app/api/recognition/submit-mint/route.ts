import { NextRequest, NextResponse } from 'next/server'
import { Transaction } from '@hashgraph/sdk'
import { getHederaClient } from '@/lib/hedera/serverClient'
import { requireMagic } from '@/lib/server/auth'
import { getTRSTBalance } from '@/lib/services/trstBalanceService'

export async function POST(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    
    const { signedTransactionBytes, tokenId } = await req.json()
    
    if (!signedTransactionBytes || !tokenId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    console.log(`[Submit Mint] Executing user-signed transactions for ${tokenId}`)
    
    // Parse bundled transactions
    const bundled = JSON.parse(signedTransactionBytes)
    const client = await getHederaClient()
    
    // Execute Transaction 1: Recognition mint (HCS)
    console.log('[Submit Mint] Executing mint transaction...')
    const mintTxBytes = Buffer.from(bundled.mint, 'base64')
    const mintTx = Transaction.fromBytes(mintTxBytes)
    const mintResponse = await mintTx.execute(client)
    const mintReceipt = await mintResponse.getReceipt(client)
    
    if (mintReceipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Mint transaction failed: ${mintReceipt.status}`)
    }
    
    const mintTxId = mintResponse.transactionId.toString()
    console.log(`[Submit Mint] Mint successful: ${mintTxId}`)
    
    // Execute Transaction 2: TRST payment
    console.log('[Submit Mint] Executing payment transaction...')
    const paymentTxBytes = Buffer.from(bundled.payment, 'base64')
    const paymentTx = Transaction.fromBytes(paymentTxBytes)
    const paymentResponse = await paymentTx.execute(client)
    const paymentReceipt = await paymentResponse.getReceipt(client)
    
    if (paymentReceipt.status.toString() !== 'SUCCESS') {
      // Mint succeeded but payment failed - this is a problem!
      console.error('[Submit Mint] Payment failed after successful mint!')
      throw new Error(`Payment transaction failed: ${paymentReceipt.status}`)
    }
    
    const paymentTxId = paymentResponse.transactionId.toString()
    console.log(`[Submit Mint] Payment successful: ${paymentTxId}`)
    
    // Get updated balance
    const { resolveOrProvision } = await import('@/lib/server/hcs22/resolveOrProvision')
    const resolution = await resolveOrProvision(user.issuer)
    const accountId = resolution.hederaAccountId
    
    const newBalance = await getTRSTBalance(accountId)
    
    return NextResponse.json({
      success: true,
      tokenId,
      mintTxId,
      paymentTxId,
      newBalance: newBalance.balance,
      message: 'Recognition minted and paid successfully!'
    })
    
  } catch (error: any) {
    console.error('[Submit Mint] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute transactions' },
      { status: 500 }
    )
  }
}
