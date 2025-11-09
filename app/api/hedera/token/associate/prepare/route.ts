// app/api/hedera/token/associate/prepare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { TokenAssociateTransaction, TokenId, AccountId } from '@hashgraph/sdk'
import { getHederaClient } from '@/lib/hedera/serverClient'
import { Magic } from '@magic-sdk/admin'

const magic = new Magic(process.env.MAGIC_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    // Verify Magic DID token
    const auth = req.headers.get('Authorization') || ''
    const didToken = auth.replace(/^Bearer\s+/i, '')
    if (!didToken) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }
    
    await magic.token.validate(didToken)
    
    const { accountId } = await req.json()

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
    }

    console.log('[API Prepare] Creating unsigned token association for:', accountId)

    const client = await getHederaClient()
    const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID

    if (!TRST_TOKEN_ID) {
      return NextResponse.json({ error: 'TRST token not configured' }, { status: 500 })
    }

    // Create unsigned transaction
    const transaction = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(TRST_TOKEN_ID)])
    
    // Freeze transaction for signing (set node account IDs and transaction ID)
    await transaction.freezeWith(client)
    
    // Convert to bytes for client-side signing
    const transactionBytes = Buffer.from(transaction.toBytes()).toString('base64')
    
    console.log('[API Prepare] Unsigned transaction prepared')
    
    return NextResponse.json({
      transactionBytes,
      accountId,
      tokenId: TRST_TOKEN_ID
    })
    
  } catch (error: any) {
    console.error('[API Prepare] Failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to prepare transaction' },
      { status: 500 }
    )
  }
}
