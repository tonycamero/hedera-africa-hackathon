// SERVER-ONLY Hedera client (no browser imports)
import { Client, PrivateKey, TopicMessageSubmitTransaction, TransferTransaction, AccountId, TokenId } from '@hashgraph/sdk'
import { assertOperatorMatchesKey } from './assertOperator'

function mustGet(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v.trim() // Remove any whitespace/newlines
}

let _client: Client | null = null
let _validated = false

export async function getHederaClient(): Promise<Client> {
  // Validate operator key matches on first call
  if (!_validated) {
    const network = (process.env.HEDERA_NETWORK ?? 'testnet').trim() as 'testnet' | 'mainnet'
    await assertOperatorMatchesKey(network)
    _validated = true
  }
  
  if (_client) return _client
  
  const operatorId = mustGet('HEDERA_OPERATOR_ID')
  const operatorKey = mustGet('HEDERA_OPERATOR_KEY')
  const network = (process.env.HEDERA_NETWORK ?? 'testnet').trim()
  
  console.log(`[Hedera Client] Network: ${network}, Operator: ${operatorId}`)
  
  try {
    // Handle different key formats: hex (0x...), DER (long), or standard
    let privateKey: PrivateKey
    if (operatorKey.startsWith('0x')) {
      // Hex format (ECDSA) - remove 0x prefix
      privateKey = PrivateKey.fromStringECDSA(operatorKey.slice(2))
    } else if (operatorKey.length > 64) {
      // DER format
      privateKey = PrivateKey.fromStringDer(operatorKey)
    } else {
      // Standard format
      privateKey = PrivateKey.fromString(operatorKey)
    }
    
    const client = Client.forName(network)
    client.setOperator(operatorId, privateKey)
    _client = client
    return _client
  } catch (error: any) {
    console.error(`[Hedera Client] Key parsing error: ${error.message}`)
    throw error
  }
}

export async function submitToTopic(topicId: string, message: string) {
  const client = await getHederaClient()
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client)
  const rcpt = await tx.getReceipt(client)
  return {
    transactionId: tx.transactionId.toString(),
    consensusTimestamp: rcpt.consensusTimestamp?.toString(),
    sequenceNumber: rcpt.topicSequenceNumber?.toNumber(),
  }
}

/**
 * Transfer TRST tokens from one account to another
 * @param fromAccountId - Sender account (user paying TRST)
 * @param toAccountId - Receiver account (treasury)
 * @param amount - Amount of TRST tokens to transfer (in whole units, not smallest unit)
 * @param tokenId - TRST token ID
 * @returns Transaction details
 */
export async function transferTRST(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  tokenId: string = process.env.NEXT_PUBLIC_TRST_TOKEN_ID || "0.0.5361653"
) {
  const client = await getHederaClient()
  
  // Convert amount to smallest unit (assuming 0 decimals for TRST)
  // If TRST has decimals, adjust this calculation
  const amountInSmallestUnit = amount
  
  console.log(`[TRST Transfer] ${fromAccountId} -> ${toAccountId}: ${amount} TRST (token: ${tokenId})`)
  
  const tx = await new TransferTransaction()
    .addTokenTransfer(tokenId, fromAccountId, -amountInSmallestUnit)
    .addTokenTransfer(tokenId, toAccountId, amountInSmallestUnit)
    .freezeWith(client)
  
  // Sign with operator (treasury) key
  const signedTx = await tx.sign(PrivateKey.fromString(mustGet('HEDERA_OPERATOR_KEY')))
  
  // Execute
  const response = await signedTx.execute(client)
  const receipt = await response.getReceipt(client)
  
  console.log(`[TRST Transfer] Success: ${response.transactionId.toString()}`)
  
  return {
    transactionId: response.transactionId.toString(),
    status: receipt.status.toString(),
    consensusTimestamp: receipt.consensusTimestamp?.toString()
  }
}
