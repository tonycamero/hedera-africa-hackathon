// Client-side TRST token transfer using Hedera SDK + Magic signing
import { magic } from '@/lib/magic'
import { TransferTransaction, TokenId, AccountId } from '@hashgraph/sdk'
import { getSessionId } from '@/lib/session'

const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID || "0.0.5361653"
const TREASURY_ACCOUNT = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_ID || "0.0.5864559"

/**
 * Transfer TRST tokens from user to treasury
 * User signs the transaction with Magic (private key never exposed)
 */
export async function payTRSTToTreasury(amount: number): Promise<string> {
  if (!magic) {
    throw new Error('Magic SDK not initialized')
  }

  console.log(`[TRST Payment] Transferring ${amount} TRST to treasury ${TREASURY_ACCOUNT}`)

  try {
    // Get user's account ID and public key from session/Magic
    const userAccountIdString = getSessionId()
    
    if (!userAccountIdString) {
      throw new Error('No session found - please sign in')
    }
    
    // Get user's public key for signature verification
    const magicResult = await magic.hedera.getPublicKey()
    const publicKeyDer = magicResult.publicKeyDer
    
    console.log('[TRST Payment] Got public key from Magic:', {
      type: typeof publicKeyDer,
      isArray: Array.isArray(publicKeyDer),
      length: publicKeyDer?.length || 0,
      first20Chars: typeof publicKeyDer === 'string' ? publicKeyDer.substring(0, 20) : 'N/A'
    })

    // Parse account IDs
    const userAccountId = AccountId.fromString(userAccountIdString)
    const treasuryAccountId = AccountId.fromString(TREASURY_ACCOUNT)
    const tokenId = TokenId.fromString(TRST_TOKEN_ID)

    // Convert amount to smallest unit
    // TRST has 6 decimals (verified from mirror node)
    const TRST_DECIMALS = 6
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, TRST_DECIMALS))

    console.log(`[TRST Payment] Transfer details:`, {
      from: userAccountId.toString(),
      to: treasuryAccountId.toString(),
      token: tokenId.toString(),
      amount: amountInSmallestUnit
    })

    console.log(`[TRST Payment] Requesting server to prepare frozen transaction...`)
    
    // Step 1: Server prepares frozen transaction
    const prepareResponse = await fetch('/api/hedera/prepare-trst-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: userAccountId.toString(),
        amount: amountInSmallestUnit
      })
    })
    
    if (!prepareResponse.ok) {
      const error = await prepareResponse.json()
      throw new Error(error.error || 'Failed to prepare transaction')
    }
    
    const { transactionBytes } = await prepareResponse.json()
    console.log(`[TRST Payment] Received frozen transaction from server (${transactionBytes.length} chars)`)
    
    // Step 2: Import Hedera SDK and reconstruct transaction client-side
    const { Transaction, PublicKey } = await import('@hashgraph/sdk')
    const txBytes = Buffer.from(transactionBytes, 'base64')
    const frozenTx = Transaction.fromBytes(txBytes)
    
    console.log(`[TRST Payment] Getting transaction body bytes for signing...`)
    // Get the actual bytes that need to be signed (transaction body bytes)
    const bodyBytes = frozenTx._signedTransactions.list[0].bodyBytes
    
    console.log(`[TRST Payment] Signing ${bodyBytes.length} body bytes with Magic...`)
    
    let signatureBytes: Uint8Array
    try {
      // Magic signs the transaction body bytes
      signatureBytes = await magic.hedera.sign(bodyBytes)
      console.log(`[TRST Payment] Magic returned signature (${signatureBytes.length} bytes)`)
    } catch (signError: any) {
      console.error(`[TRST Payment] Magic sign() failed:`, {
        message: signError.message,
        code: signError.code,
        fullError: signError
      })
      throw signError
    }
    
    // Step 3: Add signature to frozen transaction using Hedera SDK
    console.log(`[TRST Payment] Adding signature to transaction...`)
    console.log(`[TRST Payment] Public key DER: ${typeof publicKeyDer}, length: ${(publicKeyDer as string)?.length}`)
    
    // Parse the DER-encoded public key from Magic (hex string)
    let userPublicKey: typeof PublicKey
    try {
      // Try using fromString which handles DER hex strings
      userPublicKey = PublicKey.fromString(publicKeyDer as string)
      console.log(`[TRST Payment] Parsed public key: ${userPublicKey.toString()}`)
    } catch (e: any) {
      console.error(`[TRST Payment] Failed to parse public key:`, e.message)
      throw new Error(`Cannot parse public key: ${e.message}`)
    }
    
    frozenTx.addSignature(userPublicKey, signatureBytes)
    
    // Serialize the signed transaction
    const signedTxBytes = frozenTx.toBytes()
    console.log(`[TRST Payment] Created signed transaction (${signedTxBytes.length} bytes)`)
    
    console.log(`[TRST Payment] Submitting complete signed transaction to server...`)
    
    // Step 4: Send complete signed transaction
    const response = await fetch('/api/hedera/submit-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedTransactionBase64: Buffer.from(signedTxBytes).toString('base64'),
        transactionType: 'TRST_PAYMENT'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Transaction submission failed')
    }
    
    const result = await response.json()
    console.log(`[TRST Payment] Success: ${result.transactionId}`)
    
    return result.transactionId

  } catch (error: any) {
    console.error('[TRST Payment] Failed:', error)
    throw new Error(`TRST payment failed: ${error.message}`)
  }
}
