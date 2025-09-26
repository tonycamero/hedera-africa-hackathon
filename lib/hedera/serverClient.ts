// SERVER-ONLY Hedera client (no browser imports)
import { Client, PrivateKey, TopicMessageSubmitTransaction } from '@hashgraph/sdk'

function mustGet(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v.trim() // Remove any whitespace/newlines
}

let _client: Client | null = null

export function getHederaClient(): Client {
  if (_client) return _client
  const operatorId = mustGet('HEDERA_OPERATOR_ID')
  const operatorKey = mustGet('HEDERA_OPERATOR_KEY')
  const network = (process.env.HEDERA_NETWORK ?? 'testnet').trim()
  
  console.log(`[Hedera Client] Network: ${network}, Operator: ${operatorId}`)
  console.log(`[Hedera Client] Key length: ${operatorKey.length} chars`)
  
  try {
    const privateKey = PrivateKey.fromString(operatorKey)
    const publicKey = privateKey.publicKey
    console.log(`[Hedera Client] Public Key: ${publicKey.toStringDer()}`)
    
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
  const client = getHederaClient()
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