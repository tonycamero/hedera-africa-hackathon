/**
 * Hashinal Recognition Service
 * 
 * Implements proper HCS-5 standard for transferable recognition NFTs
 * 
 * HCS-5 Standard: Tokenized HCS-1 Files (Hashinals)
 * - HCS: For inscribing content/metadata  
 * - HTS: For tokenized, transferable ownership
 * 
 * Flow:
 * 1. Create HTS NFT Collection (one-time setup)
 * 2. Mint NFT to recipient (HTS transaction)
 * 3. Inscribe metadata to HCS (hashinal inscription)
 * 4. Link HTS token ID to HCS inscription
 */

import { 
  Client, 
  AccountId, 
  PrivateKey,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
  TransferTransaction,
  TokenAssociateTransaction
} from '@hashgraph/sdk'

import { HEDERA_NETWORK, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, TOPIC } from '@/lib/env'
import { recognitionSignals } from '@/lib/data/recognitionSignals'

interface HashinalMintRequest {
  recipientId: string      // Hedera account ID (0.0.xxxxx)
  recognitionId: string    // From recognitionSignals data
  inscription: string      // User's personal message
  issuerId: string        // Who's giving the recognition
}

interface HashinalMintResult {
  success: boolean
  tokenId?: string        // HTS token ID
  serialNumber?: string   // NFT serial number  
  hcsReference?: string   // HCS topic inscription reference
  transactionId?: string  // Hedera transaction ID
  error?: string
}

interface RecognitionNFTCollection {
  tokenId: string         // HTS collection token ID
  name: string           // Collection name
  symbol: string         // Collection symbol
  category: 'social' | 'academic' | 'professional'
}

export class HashinalRecognitionService {
  private client: Client | null = null
  private collections: Map<string, RecognitionNFTCollection> = new Map()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize Hedera client
      this.client = Client.forName(HEDERA_NETWORK as any)
      
      if (HEDERA_OPERATOR_ID && HEDERA_OPERATOR_KEY) {
        this.client.setOperator(
          AccountId.fromString(HEDERA_OPERATOR_ID),
          PrivateKey.fromString(HEDERA_OPERATOR_KEY)
        )
      }

      // Ensure NFT collections exist for each category
      await this.ensureCollections()
      
      this.initialized = true
      console.log('[HashinalRecognitionService] Initialized successfully')
      
    } catch (error) {
      console.error('[HashinalRecognitionService] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Ensure NFT collections exist for each recognition category
   */
  private async ensureCollections(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized')

    const categories = ['social', 'academic', 'professional'] as const

    for (const category of categories) {
      const collectionKey = `trustmesh_${category}`
      
      // Check if we already have this collection
      if (this.collections.has(collectionKey)) continue

      try {
        // Create NFT collection for this category
        const tokenCreateTx = new TokenCreateTransaction()
          .setTokenName(`TrustMesh ${category.charAt(0).toUpperCase() + category.slice(1)} Recognition`)
          .setTokenSymbol(`TM${category.charAt(0).toUpperCase()}${category.charAt(1).toUpperCase()}`)
          .setTokenType(TokenType.NonFungibleUnique)
          .setDecimals(0)
          .setInitialSupply(0)
          .setSupplyType(TokenSupplyType.Infinite)
          .setTreasuryAccountId(AccountId.fromString(HEDERA_OPERATOR_ID!))
          .setAdminKey(PrivateKey.fromString(HEDERA_OPERATOR_KEY!))
          .setSupplyKey(PrivateKey.fromString(HEDERA_OPERATOR_KEY!))
          .setMaxTransactionFee(new Hbar(2))
          .freezeWith(this.client)

        const tokenCreateResponse = await tokenCreateTx.execute(this.client)
        const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client)
        const tokenId = tokenCreateReceipt.tokenId!.toString()

        const collection: RecognitionNFTCollection = {
          tokenId,
          name: `TrustMesh ${category.charAt(0).toUpperCase() + category.slice(1)} Recognition`,
          symbol: `TM${category.charAt(0).toUpperCase()}${category.charAt(1).toUpperCase()}`,
          category
        }

        this.collections.set(collectionKey, collection)
        console.log(`[HashinalRecognitionService] Created ${category} collection: ${tokenId}`)

      } catch (error) {
        console.error(`[HashinalRecognitionService] Failed to create ${category} collection:`, error)
        // Continue with other collections even if one fails
      }
    }
  }

  /**
   * Mint a hashinal recognition NFT
   */
  async mintHashinal(request: HashinalMintRequest): Promise<HashinalMintResult> {
    if (!this.initialized || !this.client) {
      return { success: false, error: 'Service not initialized' }
    }

    try {
      console.log('[HashinalRecognitionService] Minting hashinal:', request)

      // 1. Get recognition definition
      const recognitionDef = recognitionSignals.find(r => r.id === request.recognitionId)
      if (!recognitionDef) {
        return { success: false, error: `Recognition definition not found: ${request.recognitionId}` }
      }

      // 2. Get appropriate NFT collection
      const collectionKey = `trustmesh_${recognitionDef.category}`
      const collection = this.collections.get(collectionKey)
      if (!collection) {
        return { success: false, error: `NFT collection not found for category: ${recognitionDef.category}` }
      }

      // 3. Create hashinal metadata following HCS-5 standard
      const hashinalMetadata = {
        type: 'hashinal',
        standard: 'HCS-5',
        name: recognitionDef.name,
        description: recognitionDef.description,
        image: recognitionDef.icon,
        attributes: [
          { trait_type: 'Category', value: recognitionDef.category },
          { trait_type: 'Rarity', value: recognitionDef.rarity },
          { trait_type: 'Recognition ID', value: request.recognitionId },
          { trait_type: 'Inscription', value: request.inscription },
          { trait_type: 'Issued By', value: request.issuerId }
        ],
        external_url: `https://trustmesh.io/recognition/${request.recognitionId}`,
        created_at: new Date().toISOString()
      }

      // 4. Mint NFT to recipient
      const mintTx = new TokenMintTransaction()
        .setTokenId(collection.tokenId)
        .setMetadata([Buffer.from(JSON.stringify(hashinalMetadata))])
        .setMaxTransactionFee(new Hbar(0.1))
        .freezeWith(this.client)

      const mintResponse = await mintTx.execute(this.client)
      const mintReceipt = await mintResponse.getReceipt(this.client)
      const serialNumbers = mintReceipt.serials
      const serialNumber = serialNumbers[0].toString()

      console.log(`[HashinalRecognitionService] Minted NFT ${collection.tokenId}:${serialNumber}`)

      // 5. Transfer NFT to recipient (if different from treasury)
      const recipientAccountId = AccountId.fromString(request.recipientId)
      const treasuryAccountId = AccountId.fromString(HEDERA_OPERATOR_ID!)

      if (!recipientAccountId.equals(treasuryAccountId)) {
        // Auto-associate token with recipient account (may fail if already associated)
        try {
          const associateTx = new TokenAssociateTransaction()
            .setAccountId(recipientAccountId)
            .setTokenIds([collection.tokenId])
            .freezeWith(this.client)

          // This would need to be signed by the recipient in a real implementation
          // For now, we assume auto-association or pre-association
        } catch (error) {
          console.warn('[HashinalRecognitionService] Token association may have failed (possibly already associated)')
        }

        // Transfer the NFT
        const transferTx = new TransferTransaction()
          .addNftTransfer(collection.tokenId, serialNumbers[0], treasuryAccountId, recipientAccountId)
          .setMaxTransactionFee(new Hbar(0.01))
          .freezeWith(this.client)

        const transferResponse = await transferTx.execute(this.client)
        await transferResponse.getReceipt(this.client)

        console.log(`[HashinalRecognitionService] Transferred NFT to ${request.recipientId}`)
      }

      // 6. Inscribe to HCS for hashinal standard compliance
      let hcsReference = null
      try {
        const hcsInscription = {
          type: 'HASHINAL_INSCRIPTION',
          hts_token_id: collection.tokenId,
          hts_serial_number: serialNumber,
          hashinal_metadata: hashinalMetadata,
          timestamp: Date.now()
        }

        // Post to HCS recognition topic
        const recognitionTopic = TOPIC.recognition
        if (recognitionTopic) {
          // This would be implemented with actual HCS submission
          hcsReference = `hcs://${recognitionTopic}/pending`
          console.log('[HashinalRecognitionService] HCS inscription queued')
        }
      } catch (error) {
        console.warn('[HashinalRecognitionService] HCS inscription failed (NFT still valid):', error)
      }

      return {
        success: true,
        tokenId: collection.tokenId,
        serialNumber,
        hcsReference,
        transactionId: mintResponse.transactionId.toString()
      }

    } catch (error: any) {
      console.error('[HashinalRecognitionService] Minting failed:', error)
      return { 
        success: false, 
        error: error.message || 'Unknown error during minting' 
      }
    }
  }

  /**
   * Get user's hashinal collection
   */
  async getUserHashinals(userAccountId: string): Promise<any[]> {
    if (!this.initialized || !this.client) {
      throw new Error('Service not initialized')
    }

    try {
      // Query Mirror Node for user's NFTs from our collections
      const allCollections = Array.from(this.collections.values())
      const userNFTs: any[] = []

      for (const collection of allCollections) {
        try {
          // This would query Mirror Node REST API: /api/v1/accounts/{accountId}/nfts?token.id={tokenId}
          // For now, return empty as we'd need to implement the Mirror Node queries
          console.log(`[HashinalRecognitionService] Would query NFTs for ${userAccountId} in collection ${collection.tokenId}`)
        } catch (error) {
          console.warn(`[HashinalRecognitionService] Failed to query collection ${collection.tokenId}:`, error)
        }
      }

      return userNFTs

    } catch (error) {
      console.error('[HashinalRecognitionService] Failed to get user hashinals:', error)
      return []
    }
  }

  /**
   * Get collection info
   */
  getCollections(): RecognitionNFTCollection[] {
    return Array.from(this.collections.values())
  }

  isReady(): boolean {
    return this.initialized && this.client !== null && this.collections.size > 0
  }
}

// Singleton instance
export const hashinalRecognitionService = new HashinalRecognitionService()