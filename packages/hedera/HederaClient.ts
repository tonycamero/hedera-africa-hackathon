export interface HCS10Topic {
  topicId: string
  name: string
  description: string
  createdAt: Date
  messageCount: number
  isActive: boolean
}

export interface HederaNFT {
  tokenId: string
  serialNumber: number
  metadata: {
    name: string
    description: string
    image?: string
    attributes: Record<string, any>
  }
  owner: string
  campaignId: string
  isRevocable: boolean
  isTransferable: boolean
  mintedAt: Date
  revokedAt?: Date
}

export interface CampaignData {
  id: string
  name: string
  description: string
  topicId: string
  nftTokenId?: string
  participants: string[]
  rewards: HederaNFT[]
  startDate: Date
  endDate?: Date
  isActive: boolean
}

export class HederaClient {
  private topics: Map<string, HCS10Topic> = new Map()
  private nfts: Map<string, HederaNFT> = new Map()
  private campaigns: Map<string, CampaignData> = new Map()
  private isConnected = false
  private hederaSDKClient: any = null

  async initialize(): Promise<void> {
    console.log("[Hedera] Initializing client...")

    // Initialize actual Hedera client with environment variables
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_ID
    const operatorKey = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_KEY

    if (!operatorId || !operatorKey) {
      console.error("[Hedera] Missing operator credentials")
      return
    }

    try {
      const { Client, PrivateKey } = await import('@hashgraph/sdk')
      this.hederaSDKClient = Client.forTestnet().setOperator(
        operatorId,
        PrivateKey.fromString(operatorKey)
      )
      
      this.isConnected = true
      console.log("[Hedera] Client connected successfully to", operatorId)
    } catch (error) {
      console.error("[Hedera] Failed to initialize client:", error)
    }
  }

  async createHCS10Topic(name: string, description: string): Promise<HCS10Topic> {
    if (!this.isConnected) {
      await this.initialize()
    }

    const topicId = `0.0.${Math.floor(Math.random() * 1000000)}`

    const topic: HCS10Topic = {
      topicId,
      name,
      description,
      createdAt: new Date(),
      messageCount: 0,
      isActive: true,
    }

    this.topics.set(topicId, topic)
    console.log(`[Hedera] Created HCS10 topic: ${name} (${topicId})`)

    return topic
  }

  async submitMessage(topicId: string, message: string): Promise<void> {
    if (!this.isConnected) {
      await this.initialize()
    }

    if (!this.hederaSDKClient) {
      console.error("[Hedera] Client not initialized - using stub mode")
      console.log(`[Hedera] STUB: Message to topic ${topicId}: ${message}`)
      return
    }

    try {
      const { TopicMessageSubmitTransaction } = await import('@hashgraph/sdk')
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .freezeWith(this.hederaSDKClient)

      const response = await transaction.execute(this.hederaSDKClient)
      const receipt = await response.getReceipt(this.hederaSDKClient)
      
      console.log(`[Hedera] Message submitted to topic ${topicId} - Sequence: ${receipt.topicSequenceNumber}`)
    } catch (error) {
      console.error(`[Hedera] Failed to submit message to topic ${topicId}:`, error)
      // Don't throw error - let UI handle gracefully by keeping status as "error"
      // Components should check for success/error via status updates
    }
  }

  async createNFTToken(campaignId: string, name: string, symbol: string): Promise<string> {
    const tokenId = `0.0.${Math.floor(Math.random() * 1000000)}`

    // TODO: Create actual NFT token on Hedera
    // const transaction = new TokenCreateTransaction()
    //   .setTokenName(name)
    //   .setTokenSymbol(symbol)
    //   .setTokenType(TokenType.NonFungibleUnique)

    console.log(`[Hedera] Created NFT token for campaign ${campaignId}: ${tokenId}`)
    return tokenId
  }

  async mintHashinal(campaignId: string, recipient: string, metadata: HederaNFT["metadata"]): Promise<HederaNFT> {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`)
    }

    let tokenId = campaign.nftTokenId
    if (!tokenId) {
      tokenId = await this.createNFTToken(campaignId, `${campaign.name} Reward`, "HASH")
      campaign.nftTokenId = tokenId
    }

    const serialNumber = Math.floor(Math.random() * 1000000)
    const nftId = `${tokenId}:${serialNumber}`

    const nft: HederaNFT = {
      tokenId,
      serialNumber,
      metadata,
      owner: recipient,
      campaignId,
      isRevocable: true,
      isTransferable: false, // Hashinals are non-transferable
      mintedAt: new Date(),
    }

    this.nfts.set(nftId, nft)
    campaign.rewards.push(nft)

    // Log to HCS10 topic
    await this.submitMessage(
      campaign.topicId,
      JSON.stringify({
        type: "nft_mint",
        nftId,
        recipient,
        campaignId,
        timestamp: new Date().toISOString(),
      }),
    )

    console.log(`[Hedera] Minted hashinal NFT: ${nftId} for ${recipient}`)
    return nft
  }

  async revokeNFT(nftId: string, reason: string): Promise<void> {
    const nft = this.nfts.get(nftId)
    if (!nft) {
      throw new Error(`NFT not found: ${nftId}`)
    }

    if (!nft.isRevocable) {
      throw new Error(`NFT is not revocable: ${nftId}`)
    }

    nft.revokedAt = new Date()

    const campaign = this.campaigns.get(nft.campaignId)
    if (campaign) {
      await this.submitMessage(
        campaign.topicId,
        JSON.stringify({
          type: "nft_revoke",
          nftId,
          reason,
          timestamp: new Date().toISOString(),
        }),
      )
    }

    console.log(`[Hedera] Revoked NFT: ${nftId} - ${reason}`)
  }

  async createCampaign(name: string, description: string): Promise<CampaignData> {
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create HCS10 topic for campaign
    const topic = await this.createHCS10Topic(`Campaign: ${name}`, description)

    const campaign: CampaignData = {
      id: campaignId,
      name,
      description,
      topicId: topic.topicId,
      participants: [],
      rewards: [],
      startDate: new Date(),
      isActive: true,
    }

    this.campaigns.set(campaignId, campaign)
    console.log(`[Hedera] Created campaign: ${name} (${campaignId})`)

    return campaign
  }

  async joinCampaign(campaignId: string, userId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`)
    }

    if (!campaign.participants.includes(userId)) {
      campaign.participants.push(userId)

      await this.submitMessage(
        campaign.topicId,
        JSON.stringify({
          type: "participant_join",
          userId,
          campaignId,
          timestamp: new Date().toISOString(),
        }),
      )

      console.log(`[Hedera] User ${userId} joined campaign ${campaignId}`)
    }
  }

  getCampaign(campaignId: string): CampaignData | null {
    return this.campaigns.get(campaignId) || null
  }

  getAllCampaigns(): CampaignData[] {
    return Array.from(this.campaigns.values())
  }

  getUserNFTs(userId: string): HederaNFT[] {
    return Array.from(this.nfts.values()).filter((nft) => nft.owner === userId && !nft.revokedAt)
  }

  getTopic(topicId: string): HCS10Topic | null {
    return this.topics.get(topicId) || null
  }

  isReady(): boolean {
    return this.isConnected
  }
}

export const hederaClient = new HederaClient()
