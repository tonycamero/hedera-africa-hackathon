// app/api/hedera/token/associate/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Transaction } from '@hashgraph/sdk'
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
    
    const { signedTransactionBytes } = await req.json()

    if (!signedTransactionBytes) {
      return NextResponse.json({ error: 'Missing signed transaction' }, { status: 400 })
    }

    console.log('[API Submit] Submitting signed token association...')

    const client = await getHederaClient()
    
    // Deserialize the signed transaction
    const signedTx = Transaction.fromBytes(
      Buffer.from(signedTransactionBytes, 'base64')
    )
    
    // Execute the signed transaction
    const txResponse = await signedTx.execute(client)
    
    console.log('[API Submit] Transaction submitted:', txResponse.transactionId.toString())
    
    // Get receipt
    const receipt = await txResponse.getReceipt(client)
    
    console.log('[API Submit] Token association successful:', receipt.status.toString())
    
    return NextResponse.json({
      success: true,
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString()
    })
    
  } catch (error: any) {
    console.error('[API Submit] Failed:', error)
    
    // Handle already-associated case
    if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
      console.log('[API Submit] Token already associated (OK)')
      return NextResponse.json({
        success: true,
        status: 'ALREADY_ASSOCIATED'
      })
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to submit transaction' },
      { status: 500 }
    )
  }
}
