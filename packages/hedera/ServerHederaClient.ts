import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TopicMessageSubmitTransaction,
  TopicCreateTransaction,
  Hbar
} from '@hashgraph/sdk'

/**
 * SERVER-SIDE ONLY Hedera client with private key access
 * This should NEVER be imported in client-side code
 */
export class ServerHederaClient {
  private client: Client | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('[ServerHedera] Initializing server-side Hedera client...')
    
    const network = process.env.HEDERA_NETWORK || 'testnet'
    const operatorId = process.env.HEDERA_OPERATOR_ID
    const operatorKey = process.env.HEDERA_OPERATOR_KEY

    if (!operatorId || !operatorKey) {
      throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in server environment')
    }

    try {
      // Create client for the appropriate network
      if (network === 'mainnet') {
        this.client = Client.forMainnet()
      } else if (network === 'testnet') {
        this.client = Client.forTestnet()
      } else if (network === 'previewnet') {
        this.client = Client.forPreviewnet()
      } else {
        throw new Error(`Unsupported network: ${network}`)
      }

      // Set operator account with private key
      const accountId = AccountId.fromString(operatorId)
      const privateKey = PrivateKey.fromStringED25519(operatorKey)
      
      this.client.setOperator(accountId, privateKey)
      
      // Set default max transaction fee
      this.client.setDefaultMaxTransactionFee(new Hbar(2))
      this.client.setDefaultMaxQueryPayment(new Hbar(1))

      this.isInitialized = true
      console.log(`[ServerHedera] ✅ Initialized for ${network} with operator ${operatorId}`)
      
    } catch (error) {
      console.error('[ServerHedera] ❌ Failed to initialize:', error)
      throw error
    }
  }

  async submitMessage(topicId: string, message: string): Promise<string> {
    if (!this.isInitialized || !this.client) {
      await this.initialize()
    }

    if (!this.client) {
      throw new Error('Hedera client not initialized')
    }

    try {
      console.log(`[ServerHedera] Submitting message to topic ${topicId}...`)
      
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .setMaxTransactionFee(new Hbar(1))

      const txResponse = await transaction.execute(this.client)
      const receipt = await txResponse.getReceipt(this.client)
      
      const sequenceNumber = receipt.topicSequenceNumber?.toString() || 'unknown'
      
      console.log(`[ServerHedera] ✅ Message submitted to ${topicId}, sequence: ${sequenceNumber}`)
      return sequenceNumber
      
    } catch (error) {
      console.error(`[ServerHedera] ❌ Failed to submit message to ${topicId}:`, error)
      throw error
    }
  }

  async createTopic(memo?: string): Promise<string> {
    if (!this.isInitialized || !this.client) {
      await this.initialize()
    }

    if (!this.client) {
      throw new Error('Hedera client not initialized')
    }

    try {
      console.log('[ServerHedera] Creating new HCS topic...')
      
      const transaction = new TopicCreateTransaction()
        .setMaxTransactionFee(new Hbar(5))
      
      if (memo) {
        transaction.setTopicMemo(memo)
      }

      const txResponse = await transaction.execute(this.client)
      const receipt = await txResponse.getReceipt(this.client)
      
      const topicId = receipt.topicId?.toString()
      if (!topicId) {
        throw new Error('Failed to get topic ID from receipt')
      }
      
      console.log(`[ServerHedera] ✅ Created topic: ${topicId}`)
      return topicId
      
    } catch (error) {
      console.error('[ServerHedera] ❌ Failed to create topic:', error)
      throw error
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.client !== null
  }

  /**
   * Clean shutdown - close client connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.isInitialized = false
      console.log('[ServerHedera] Client connection closed')
    }
  }
}

// Export singleton instance for server-side use only
export const serverHederaClient = new ServerHederaClient()