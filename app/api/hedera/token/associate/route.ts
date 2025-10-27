// app/api/hedera/token/associate/route.ts
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

    console.log('[API] Associating TRST token for account:', accountId)

    const client = await getHederaClient()
    const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID

    if (!TRST_TOKEN_ID) {
      return NextResponse.json({ error: 'TRST token not configured' }, { status: 500 })
    }

    // NOTE: This is operator-paid association
    // Hedera requires the account owner to sign, OR the operator can pay if account allows
    // For new Magic accounts, this will fail unless we have the user's private key
    // The proper solution is to have Magic sign the transaction client-side
    
    try {
      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString(TRST_TOKEN_ID)])
        .execute(client)

      const receipt = await associateTx.getReceipt(client)
      
      console.log('[API] Token association successful:', receipt.status.toString())
      
      return NextResponse.json({
        success: true,
        accountId,
        tokenId: TRST_TOKEN_ID,
        status: receipt.status.toString()
      })
      
    } catch (error: any) {
      if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
        console.log('[API] Token already associated (OK)')
        return NextResponse.json({
          success: true,
          accountId,
          tokenId: TRST_TOKEN_ID,
          status: 'ALREADY_ASSOCIATED'
        })
      }
      throw error
    }

  } catch (error: any) {
    console.error('[API] Token association failed:', error)
    return NextResponse.json(
      { error: error.message || 'Token association failed' },
      { status: 500 }
    )
  }
}
