/**
 * Recognition signal types
 * 
 * Signals are IMMUTABLE after mint - the minter's lens overlay
 * (label, emoji, description) is frozen permanently.
 */

export type LensKey = 'base' | 'genz' | 'african'

export interface RecognitionSignal {
  // Unique identifier
  id: string                     // uuid or HCS message id
  
  // FROZEN metadata from mint time (never transformed)
  label: string                  // "Truth" or "No Cap" or "Ubuntu"
  emoji: string                  // 💎 or 🔥 or 🌍
  description?: string           // longer description
  lens: LensKey                  // which lens was used to mint (attribution)
  
  // Relationship data
  from: { accountId: string; handle?: string }
  to: { accountId: string; handle?: string }
  note?: string                  // personal message from sender
  
  // Provenance
  timestamp: string              // ISO timestamp
  txId?: string                  // HCS message ID or tx hash
  
  // OPTIONAL: present only if user opted to mint as NFT
  nftTokenId?: string            // e.g., "0.0.1234567" (Hedera token ID)
  nftSerialNumber?: number       // serial within the collection
}
