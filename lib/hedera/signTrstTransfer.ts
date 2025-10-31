/**
 * Client-side recognition mint with bundled TRST payment
 * 
 * ONE-CLICK FLOW:
 * 1. Server prepares bundled transaction (HCS submit + TRST transfer)
 * 2. Client signs ONCE with Magic
 * 3. Server executes both transactions atomically
 */

import { magic } from '@/lib/magic'

export interface RecognitionMintRequest {
  accountId: string
  tokenId: string
  name: string
  category: string
  subtitle?: string
  emoji: string
  recipientId: string
  senderName?: string
  recipientName?: string
  message?: string
  trustAmount?: number
}

/**
 * ONE-CLICK recognition mint with bundled TRST payment
 * 
 * User signs ONCE, both transactions execute atomically:
 * 1. HCS topic message submission (recognition mint)
 * 2. TRST transfer to treasury (payment)
 */
export async function mintRecognitionWithPayment(request: RecognitionMintRequest): Promise<{
  success: boolean
  tokenId?: string
  mintTxId?: string
  paymentTxId?: string
  newBalance?: number
  error?: string
}> {
  const { accountId, tokenId, name, category, recipientId, message } = request
  
  console.log('[Recognition Mint] Initiating one-click mint + payment:', { tokenId, recipientId })
  
  try {
    const token = await magic.user.getIdToken()
    
    // Step 1: Server prepares BUNDLED unsigned transactions
    const prepareResponse = await fetch('/api/recognition/prepare-mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    })
    
    if (!prepareResponse.ok) {
      const error = await prepareResponse.json()
      throw new Error(error.error || 'Failed to prepare mint')
    }
    
    const { transactionBytes } = await prepareResponse.json()
    
    console.log('[Recognition Mint] Received bundled unsigned transactions')
    
    // Step 2: User signs ONCE with Magic (signs both transactions)
    console.log('[Recognition Mint] Requesting ONE signature from user...')
    const signedTxBytes = await magic.hedera.signTransaction(
      Buffer.from(transactionBytes, 'base64')
    )
    
    console.log('[Recognition Mint] User signed both transactions')
    
    // Step 3: Server executes both transactions
    const submitResponse = await fetch('/api/recognition/submit-mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        signedTransactionBytes: Buffer.from(signedTxBytes).toString('base64'),
        tokenId
      })
    })
    
    if (!submitResponse.ok) {
      const error = await submitResponse.json()
      throw new Error(error.error || 'Failed to submit mint')
    }
    
    const result = await submitResponse.json()
    
    console.log('[Recognition Mint] Success! Mint TX:', result.mintTxId, 'Payment TX:', result.paymentTxId)
    
    return {
      success: true,
      tokenId: result.tokenId,
      mintTxId: result.mintTxId,
      paymentTxId: result.paymentTxId,
      newBalance: result.newBalance
    }
  } catch (error: any) {
    console.error('[Recognition Mint] Failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
