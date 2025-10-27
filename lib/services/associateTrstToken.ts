import { magic } from '@/lib/magic'
import { TokenAssociateTransaction, TokenId, AccountId, PublicKey, Client } from '@hashgraph/sdk'

const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID || '0.0.5361653'
const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'

/**
 * Associate TRST token with user's Hedera account via Magic signing
 * This must be done before the account can receive TRST tokens
 * 
 * Uses Hedera SDK's signer interface to let Magic sign the transaction
 */
export async function associateTrstTokenViaMagic(accountId: string): Promise<{ transactionId: string; status: string }> {
  try {
    console.log(`[TRST Association] Starting for account ${accountId}`)
    
    if (!magic) throw new Error('Magic not initialized')
    
    // 1. Get Magic's public key
    const { publicKeyDer } = await magic.hedera.getPublicKey()
    if (!publicKeyDer) throw new Error('Failed to get Magic public key')
    
    // 2. Convert DER ArrayBuffer to Uint8Array and create PublicKey
    const publicKeyBytes = new Uint8Array(publicKeyDer as ArrayBuffer)
    const publicKey = PublicKey.fromBytesDER(publicKeyBytes)
    
    // 3. Create a Hedera SDK signer that uses Magic for signing
    const magicSigner = {
      getAccountId: async () => AccountId.fromString(accountId),
      getAccountKey: async () => publicKey,
      sign: async (message: Uint8Array) => {
        console.log('[TRST Association] Signing with Magic...')
        const signature = await magic.hedera.sign(message)
        return new Uint8Array(signature)
      }
    }
    
    // 4. Create Hedera client for testnet
    const client = Client.forTestnet()
    
    // 5. Build and execute token association transaction
    console.log('[TRST Association] Building transaction...')
    const transaction = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(TRST_TOKEN_ID)])
    
    // Freeze with our custom signer
    const frozenTx = await transaction.freezeWith(client)
    
    // Sign with Magic
    const signedTx = await frozenTx.sign(publicKey, magicSigner.sign)
    
    // Execute
    console.log('[TRST Association] Submitting to Hedera...')
    const response = await signedTx.execute(client)
    
    // Get receipt
    const receipt = await response.getReceipt(client)
    
    console.log(`[TRST Association] Success! Status: ${receipt.status.toString()}`)
    
    return {
      transactionId: response.transactionId.toString(),
      status: receipt.status.toString()
    }
    
  } catch (error: any) {
    console.error('[TRST Association] Failed:', error)
    
    // Check if already associated (this is OK)
    if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED') || error.message?.includes('ALREADY_ASSOCIATED')) {
      console.log('[TRST Association] Token already associated (OK)')
      return {
        transactionId: 'N/A',
        status: 'TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT'
      }
    }
    
    throw error
  }
}
