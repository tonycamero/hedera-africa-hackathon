/**
 * HCS Asset Collection Service
 * 
 * Web3-style client-side service for querying user's recognition token collection
 * directly from Hedera Consensus Service (HCS) via Mirror Node.
 * 
 * Follows crypto wallet patterns:
 * - Client-side queries only
 * - Direct blockchain data access
 * - User owns their data queries
 * - No server-side intermediaries
 */

import { SignalAsset, SignalRarity } from '@/lib/types/signals-collectible'
import { recognitionSignals } from '@/lib/data/recognitionSignals'
import { TOPIC, MIRROR_REST } from '@/lib/env'

interface HCSMessage {
  consensus_timestamp: string
  message: string // base64
  topic_id: string
  sequence_number: number
}

interface MirrorResponse {
  messages: HCSMessage[]
  links?: {
    next?: string
  }
}

interface RecognitionMintEvent {
  type: 'RECOGNITION_MINT'
  actor: string // issuer
  target: string // recipient/owner
  timestamp?: string
  metadata: {
    recognitionId?: string
    recognition_id?: string
    evidence?: string
    context?: string
    issuer?: string
    definitionId?: string
    note?: string
    [key: string]: any
  }
  id?: string
  ts?: number
}

export class HCSAssetCollectionService {
  private cache = new Map<string, SignalAsset[]>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_MESSAGES = 100

  /**
   * Get user's recognition token collection by querying HCS directly
   */
  async getUserCollection(userAddress: string): Promise<SignalAsset[]> {
    try {
      console.log(`[HCSAssetCollection] Loading collection for ${userAddress}`)
      
      // Check cache first
      const cacheKey = `collection:${userAddress}`
      const cached = this.cache.get(cacheKey)
      if (cached) {
        console.log(`[HCSAssetCollection] Using cached collection (${cached.length} assets)`)
        return cached
      }

      // Query HCS recognition topic directly
      const recognitionTopic = TOPIC.recognition
      if (!recognitionTopic) {
        console.warn('[HCSAssetCollection] No recognition topic configured')
        return []
      }

      console.log(`[HCSAssetCollection] Querying topic ${recognitionTopic}`)
      
      // Fetch recognition messages from Mirror Node
      const messages = await this.fetchTopicMessages(recognitionTopic, this.MAX_MESSAGES)
      console.log(`[HCSAssetCollection] Retrieved ${messages.length} messages`)

      // Parse and filter for this user's assets
      const userAssets = this.parseRecognitionAssets(messages, userAddress)
      console.log(`[HCSAssetCollection] Found ${userAssets.length} assets for ${userAddress}`)

      // Cache the results
      this.cache.set(cacheKey, userAssets)
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL)

      return userAssets
      
    } catch (error) {
      console.error('[HCSAssetCollection] Failed to load collection:', error)
      return []
    }
  }

  /**
   * Fetch messages from HCS topic via Mirror Node REST API
   */
  private async fetchTopicMessages(topicId: string, limit: number = 50): Promise<HCSMessage[]> {
    try {
      const url = `${MIRROR_REST}/topics/${topicId}/messages?limit=${limit}&order=desc`
      console.log(`[HCSAssetCollection] Fetching: ${url}`)
      
      const response = await fetch(url, {
        cache: 'no-store' // Always get fresh data for user assets
      })

      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`)
      }

      const data: MirrorResponse = await response.json()
      return data.messages || []
      
    } catch (error) {
      console.error(`[HCSAssetCollection] Failed to fetch from topic ${topicId}:`, error)
      return []
    }
  }

  /**
   * Parse HCS messages into user's SignalAsset collection
   */
  private parseRecognitionAssets(messages: HCSMessage[], userAddress: string): SignalAsset[] {
    const assets: SignalAsset[] = []
    const processedIds = new Set<string>()

    for (const message of messages) {
      try {
        // Decode base64 message
        const decoded = this.decodeMessage(message.message)
        if (!decoded) continue

        const event: RecognitionMintEvent = JSON.parse(decoded)
        
        // Only process RECOGNITION_MINT events for this user
        if (event.type !== 'RECOGNITION_MINT' || event.target !== userAddress) {
          continue
        }

        // Create unique asset ID to prevent duplicates
        const assetId = event.id || `hcs_${message.topic_id}_${message.sequence_number}`
        if (processedIds.has(assetId)) continue
        processedIds.add(assetId)

        // Extract recognition details
        const recognitionId = event.metadata.recognitionId || event.metadata.recognition_id || 'unknown'
        const evidence = event.metadata.evidence || 'Recognition earned on HCS'
        const context = event.metadata.context || 'TrustMesh Network'
        const issuer = event.metadata.issuer || event.actor

        // Find matching recognition definition
        const recognitionDef = recognitionSignals.find(r => r.id === recognitionId)

        // Parse timestamp
        const timestamp = event.timestamp || message.consensus_timestamp
        const issuedAt = this.parseHCSTimestamp(timestamp)

        // Create SignalAsset
        const asset: SignalAsset = {
          asset_id: assetId,
          instance_id: `inst_${message.sequence_number}`,
          type_id: `${recognitionId}@1`,
          issuer_pub: issuer,
          recipient_pub: userAddress,
          issued_at: issuedAt,
          metadata: {
            category: recognitionDef?.name || recognitionId,
            rarity: this.mapRarityToSignalRarity(recognitionDef?.rarity || 'Common'),
            inscription: evidence,
            labels: [
              recognitionDef?.category || 'recognition',
              context.toLowerCase().replace(/\s+/g, '-'),
              'hcs-verified',
              'live-data'
            ]
          }
        }

        assets.push(asset)

      } catch (error) {
        // Skip invalid messages silently
        continue
      }
    }

    // Sort by issued_at descending (newest first)
    return assets.sort((a, b) => 
      new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    )
  }

  /**
   * Decode base64 HCS message
   */
  private decodeMessage(base64Message: string): string | null {
    try {
      if (typeof atob !== 'undefined') {
        return atob(base64Message)
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64Message, 'base64').toString('utf-8')
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Parse HCS consensus timestamp to ISO string
   */
  private parseHCSTimestamp(timestamp: string): string {
    try {
      // HCS timestamps are in format "seconds.nanoseconds"
      if (timestamp.includes('.')) {
        const [seconds, nanoseconds] = timestamp.split('.')
        const milliseconds = parseInt(seconds) * 1000 + parseInt(nanoseconds.slice(0, 3))
        return new Date(milliseconds).toISOString()
      }
      // Fallback for other formats
      return new Date(timestamp).toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  /**
   * Map recognition signal rarity to SignalAsset rarity
   */
  private mapRarityToSignalRarity(rarity: string): SignalRarity {
    const rarityMap: Record<string, SignalRarity> = {
      'Common': 'Regular',
      'Uncommon': 'Regular', 
      'Rare': 'Heat',
      'Epic': 'Peak',
      'Legendary': 'God-Tier'
    }
    return rarityMap[rarity] || 'Regular'
  }

  /**
   * Clear cache for a user (useful for refresh)
   */
  clearUserCache(userAddress: string): void {
    const cacheKey = `collection:${userAddress}`
    this.cache.delete(cacheKey)
  }

  /**
   * Get collection statistics for a user
   */
  async getCollectionStats(userAddress: string): Promise<{
    totalCount: number
    rarityBreakdown: Record<SignalRarity, number>
    categoryBreakdown: Record<string, number>
    recentCount: number
  }> {
    const assets = await this.getUserCollection(userAddress)
    
    const rarityBreakdown: Record<SignalRarity, number> = {
      'Regular': 0,
      'Heat': 0,
      'Peak': 0,
      'God-Tier': 0
    }
    
    const categoryBreakdown: Record<string, number> = {}
    
    // Count last 7 days
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    let recentCount = 0

    assets.forEach(asset => {
      // Rarity breakdown
      rarityBreakdown[asset.metadata.rarity]++
      
      // Category breakdown
      const category = asset.metadata.category
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1
      
      // Recent count
      if (new Date(asset.issued_at) > oneWeekAgo) {
        recentCount++
      }
    })

    return {
      totalCount: assets.length,
      rarityBreakdown,
      categoryBreakdown,
      recentCount
    }
  }

  /**
   * Convert user address/handle to Hedera account ID
   */
  private convertToAccountId(userAddress: string): string | null {
    // If already in account ID format, return as-is
    if (userAddress.match(/^0\.0\.[0-9]+$/)) {
      return userAddress
    }
    
    // For demo purposes, map known handles to account IDs
    const handleToAccountMap: Record<string, string> = {
      'tm-alex-chen': '0.0.123456',
      'alex-chen': '0.0.123456',
      '@alex': '0.0.123456'
    }
    
    const accountId = handleToAccountMap[userAddress.toLowerCase()]
    if (accountId) {
      return accountId
    }
    
    // In production, this would query a handle resolution service
    console.warn(`[HCSAssetCollection] No account ID found for handle: ${userAddress}`)
    return '0.0.123456' // Default for demo
  }

  /**
   * Fetch user's NFTs from Mirror Node
   */
  private async fetchUserNFTs(accountId: string): Promise<any[]> {
    try {
      const url = `${MIRROR_REST}/accounts/${accountId}/nfts?limit=100&order=desc`
      console.log(`[HCSAssetCollection] Fetching NFTs: ${url}`)
      
      const response = await fetch(url, {
        cache: 'no-store' // Always get fresh data for user assets
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[HCSAssetCollection] Account ${accountId} not found or has no NFTs`)
          return []
        }
        throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.nfts || []
      
    } catch (error) {
      console.error(`[HCSAssetCollection] Failed to fetch NFTs for ${accountId}:`, error)
      return []
    }
  }

  /**
   * Transform Mirror Node NFT data to SignalAsset format
   */
  private transformNFTsToSignalAssets(nfts: any[], userAddress: string): SignalAsset[] {
    const assets: SignalAsset[] = []
    const processedIds = new Set<string>()

    for (const nft of nfts) {
      try {
        // Only process NFTs from our recognition token collections
        if (!this.isRecognitionToken(nft.token_id)) {
          continue
        }

        // Create unique asset ID
        const assetId = `${nft.token_id}:${nft.serial_number}`
        if (processedIds.has(assetId)) continue
        processedIds.add(assetId)

        // Parse NFT metadata
        let metadata: any = {}
        try {
          if (nft.metadata) {
            const metadataString = Buffer.from(nft.metadata, 'base64').toString('utf-8')
            metadata = JSON.parse(metadataString)
          }
        } catch (error) {
          console.warn(`[HCSAssetCollection] Failed to parse metadata for ${assetId}:`, error)
        }

        // Extract recognition details from metadata
        const recognitionId = this.extractRecognitionId(metadata)
        const recognitionDef = recognitionSignals.find(r => r.id === recognitionId)

        // Create SignalAsset
        const asset: SignalAsset = {
          asset_id: assetId,
          instance_id: `nft_${nft.serial_number}`,
          type_id: `${recognitionId}@1`,
          issuer_pub: this.extractIssuer(metadata) || 'unknown',
          recipient_pub: userAddress,
          issued_at: nft.created_timestamp || new Date().toISOString(),
          metadata: {
            category: recognitionDef?.name || metadata.name || 'Unknown Recognition',
            rarity: this.mapRarityToSignalRarity(recognitionDef?.rarity || 'Common'),
            inscription: this.extractInscription(metadata) || 'Recognition earned',
            labels: [
              recognitionDef?.category || 'recognition',
              'hashinal',
              'hts-nft',
              'transferable'
            ]
          }
        }

        assets.push(asset)

      } catch (error) {
        console.warn(`[HCSAssetCollection] Failed to process NFT:`, error)
        continue
      }
    }

    // Sort by issued_at descending (newest first)
    return assets.sort((a, b) => 
      new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    )
  }

  /**
   * Check if token ID belongs to our recognition collections
   */
  private isRecognitionToken(tokenId: string): boolean {
    // In production, this would check against known collection token IDs
    // For now, we'll assume any NFT could be a recognition token
    return true
  }

  /**
   * Extract recognition ID from NFT metadata
   */
  private extractRecognitionId(metadata: any): string {
    // Look for recognition ID in various metadata formats
    const recognitionId = 
      metadata.attributes?.find((attr: any) => attr.trait_type === 'Recognition ID')?.value ||
      metadata.recognitionId ||
      metadata.recognition_id ||
      'unknown'
    
    return recognitionId
  }

  /**
   * Extract issuer from NFT metadata
   */
  private extractIssuer(metadata: any): string | null {
    return (
      metadata.attributes?.find((attr: any) => attr.trait_type === 'Issued By')?.value ||
      metadata.issuer ||
      metadata.issuerId ||
      null
    )
  }

  /**
   * Extract inscription from NFT metadata
   */
  private extractInscription(metadata: any): string | null {
    return (
      metadata.attributes?.find((attr: any) => attr.trait_type === 'Inscription')?.value ||
      metadata.inscription ||
      metadata.description ||
      null
    )
  }
}

// Singleton instance for use across the app
export const hcsAssetCollection = new HCSAssetCollectionService()
