import { NextRequest, NextResponse } from 'next/server'
import { TransferTransaction, AccountId } from '@hashgraph/sdk'
import { getHederaClient } from '@/lib/hedera/serverClient'
import { requireMagic } from '@/lib/server/auth'
import { getTRSTBalance } from '@/lib/services/trstBalanceService'

const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID!
const TREASURY_ACCOUNT_ID = process.env.HEDERA_OPERATOR_ID!

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireMagic(req)
    
    const { accountId, amount, purpose, metadata } = await req.json()
    
    if (!accountId || !amount || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, amount, purpose' },
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
    
    console.log(`[TRST Prepare] Preparing payment of ${amount} TRST from ${accountId}`)
    
    // Check balance
    const balance = await getTRSTBalance(accountId)
    if (balance.balance < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient TRST balance',
          required: amount,
          current: balance.balance
        },
        { status: 402 }
      )
    }
    
    // Convert amount to base units (TRST has 6 decimals)
    const amountInBaseUnits = Math.floor(amount * 1_000_000)
    
    // Get Hedera client for transaction building
    const client = await getHederaClient()
    
    // Build unsigned transaction
    const transaction = new TransferTransaction()
      .addTokenTransfer(TRST_TOKEN_ID, accountId, -amountInBaseUnits)
      .addTokenTransfer(TRST_TOKEN_ID, TREASURY_ACCOUNT_ID, amountInBaseUnits)
      .setTransactionMemo(`TRST payment: ${purpose}`)
      .freezeWith(client)
    
    // Serialize to bytes
    const transactionBytes = Buffer.from(transaction.toBytes()).toString('base64')
    
    console.log(`[TRST Prepare] Prepared unsigned transaction for ${accountId}`)
    
    return NextResponse.json({
      transactionBytes,
      amount,
      amountInBaseUnits,
      treasuryAccount: TREASURY_ACCOUNT_ID,
      purpose,
      memo: `TRST payment: ${purpose}`
    })
    
  } catch (error: any) {
    console.error('[TRST Prepare] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to prepare payment' },
      { status: 500 }
    )
  }
}
