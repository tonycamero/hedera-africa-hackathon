// SERVER-ONLY Hedera client (no browser imports)
import { Client, PrivateKey, TopicMessageSubmitTransaction } from '@hashgraph/sdk'
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
