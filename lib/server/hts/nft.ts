/**
 * Recognition NFT minter (HTS)
 * 
 * Phase 2: Turn HCS-only recognition into a transferable NFT.
 * This file is a SAFE STUB: no keys, no network calls yet.
 * 
 * Replace the mock implementation with Hedera SDK when ready:
 *  - TokenId.fromString(process.env.RECOGNITION_NFT_TOKEN_ID!)
 *  - new TokenMintTransaction().setTokenId(...).addMetadata(...).execute(client)
 */

export type MintRecognitionNftInput = {
  label: string
  emoji: string
  description?: string
  lens: 'base' | 'genz' | 'african'
  metadata: {
    hcsMessageId?: string
    from: string
    to: string
    timestamp: string
  }
}

export type MintRecognitionNftResult = {
  tokenId: string
  serial: number
  txId: string
}

/**
 * Encodes minimal metadata for NFT (Phase 2 real implementation can pin JSON).
 * For now, we keep it tiny and deterministic.
 */
function encodeNftMetadata(input: MintRecognitionNftInput): Uint8Array {
  const payload = {
    t: 'recognition',
    l: input.label,
    e: input.emoji,
    d: input.description,
    x: input.lens,
    p: input.metadata,
  }
  const json = JSON.stringify(payload)
  return new TextEncoder().encode(json)
}

export async function mintRecognitionNFT(
  input: MintRecognitionNftInput
): Promise<MintRecognitionNftResult> {
  const tokenId = process.env.RECOGNITION_NFT_TOKEN_ID

  if (!tokenId) {
    console.warn('[NFT] RECOGNITION_NFT_TOKEN_ID not set — returning mock NFT result.')
    // Mock: simulate a successful mint
    return {
      tokenId: '0.0.mockToken',
      serial: Math.floor(Date.now() / 1000) % 100000,
      txId: `mock-nft-mint-${Date.now()}`,
    }
  }

  // TODO: Real SDK path (when keys & client are configured)
  // const client = hederaClient() // your client factory
  // const metadata = encodeNftMetadata(input)
  // const mintTx = await new TokenMintTransaction()
  //   .setTokenId(TokenId.fromString(tokenId))
  //   .addMetadata(metadata)
  //   .execute(client)
  // const receipt = await mintTx.getReceipt(client)
  // const serial = Number(receipt.serials?.[0].toString() ?? '0')
  // return { tokenId, serial, txId: mintTx.transactionId.toString() }

  // For now: light mock with encoded bytes to verify size locally
  const metadataBytes = encodeNftMetadata(input)
  console.log('[NFT] (stub) would mint 1 NFT with metadata bytes:', metadataBytes.length)

  return {
    tokenId,
    serial: Math.floor(Math.random() * 100000) + 1,
    txId: `stub-nft-mint-${Date.now()}`,
  }
}
