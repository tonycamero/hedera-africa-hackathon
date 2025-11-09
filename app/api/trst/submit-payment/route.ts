import { NextRequest, NextResponse } from 'next/server'
import { Transaction } from '@hashgraph/sdk'
import { getHederaClient } from '@/lib/hedera/serverClient'
import { requireMagic } from '@/lib/server/auth'
import { getTRSTBalance } from '@/lib/services/trstBalanceService'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireMagic(req)
    
    const { signedTransactionBytes, accountId, purpose } = await req.json()
    
    if (!signedTransactionBytes || !accountId || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: signedTransactionBytes, accountId, purpose' },
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
    
    console.log(`[TRST Submit] Submitting user-signed TRST payment for ${accountId}`)
    
    // Get Hedera client
    const client = await getHederaClient()
    
    // Deserialize signed transaction
    const transactionBytes = Buffer.from(signedTransactionBytes, 'base64')
    const transaction = Transaction.fromBytes(transactionBytes)
    
    console.log(`[TRST Submit] Executing transaction...`)
    
    // Execute the user-signed transaction
    const txResponse = await transaction.execute(client)
    const receipt = await txResponse.getReceipt(client)
    
    if (receipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Transaction failed with status: ${receipt.status}`)
    }
    
    const transactionId = txResponse.transactionId.toString()
    
    console.log(`[TRST Submit] Payment successful: ${transactionId}`)
    
    // Get updated balance
    const newBalance = await getTRSTBalance(accountId)
    
    return NextResponse.json({
      success: true,
      transactionId,
      status: receipt.status.toString(),
      newBalance: newBalance.balance,
      purpose
    })
    
  } catch (error: any) {
    console.error('[TRST Submit] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit payment' },
      { status: 500 }
    )
  }
}
