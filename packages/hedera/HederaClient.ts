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

/**
 * CLIENT-SIDE ONLY Hedera client - NO LEDGER OPERATIONS ALLOWED
 * All blockchain operations must go through server-side APIs
 */
export class HederaClient {
  private isConnected = false

  async initialize(): Promise<void> {
    console.log("[Hedera] Client initialized - READ-ONLY mode")
    console.log("[Hedera] All ledger operations are server-side only")
    this.isConnected = true
  }

  async createHCS10Topic(): Promise<never> {
    throw new Error("CLIENT-SIDE LEDGER OPERATIONS DISABLED: Use server-side API /api/hcs/create-topic")
  }

  async submitMessage(): Promise<never> {
    throw new Error("CLIENT-SIDE LEDGER OPERATIONS DISABLED: Use server-side API /api/hcs/submit")
  }

  // ALL LEDGER OPERATIONS REMOVED
  // Use server-side APIs for any blockchain operations
  async createNFTToken(): Promise<never> {
    throw new Error("CLIENT-SIDE LEDGER OPERATIONS DISABLED: Use server-side API")
  }

  async mintHashinal(): Promise<never> {
    throw new Error("CLIENT-SIDE LEDGER OPERATIONS DISABLED: Use server-side API")
  }

  async revokeNFT(): Promise<never> {
    throw new Error("CLIENT-SIDE LEDGER OPERATIONS DISABLED: Use server-side API")
  }

  async createCampaign(): Promise<never> {
    throw new Error("CLIENT-SIDE LEDGER OPERATIONS DISABLED: Use server-side API")
  }

  async joinCampaign(): Promise<never> {
    throw new Error("CLIENT-SIDE LEDGER OPERATIONS DISABLED: Use server-side API")
  }

  getCampaign(): null {
    console.warn("CLIENT-SIDE DATA ACCESS DISABLED: Use server-side API")
    return null
  }

  getAllCampaigns(): never[] {
    console.warn("CLIENT-SIDE DATA ACCESS DISABLED: Use server-side API")
    return []
  }

  getUserNFTs(): never[] {
    console.warn("CLIENT-SIDE DATA ACCESS DISABLED: Use server-side API")
    return []
  }

  getTopic(): null {
    console.warn("CLIENT-SIDE DATA ACCESS DISABLED: Use server-side API")
    return null
  }

  isReady(): boolean {
    return this.isConnected
  }
}

export const hederaClient = new HederaClient()
