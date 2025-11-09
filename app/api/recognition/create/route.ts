import { NextRequest, NextResponse } from 'next/server'
import { requireMagic, getAccountId } from '@/lib/server/auth'
import { settlementPort } from '@/lib/server/settlement/settlementPort'
import { publishHcs21 } from '@/lib/server/hcs/hcs21'
import { recognitionStore } from '@/lib/server/recognitionStore'
import { RecognitionSignal, type LensKey } from '@/lib/recognition/types'
import { LENS_MINT_PRICE_TRST } from '@/lib/lens/lensConfig'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

type RequestBody = {
  label: string
  emoji: string
  description?: string
  lens: LensKey
  to: { accountId: string; handle?: string }
  note?: string
  mintAsNFT?: boolean  // Optional: mint as transferable HTS NFT
}

/**
 * POST /api/recognition/create
 * 
 * Mints a recognition signal with FROZEN metadata from minter's lens.
 * Everyone will see this exact label/emoji/description forever.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    
    // Use HCS-22 resolution to get the authoritative Hedera account ID
    const { resolveOrProvision } = await import('@/lib/server/hcs22/resolveOrProvision')
    const resolution = await resolveOrProvision(user.issuer)
    const fromAccount = resolution.hederaAccountId
    
    console.log(`[API /recognition/create] Resolved ${user.issuer} → ${fromAccount}`)

    const { label, emoji, description, lens, to, note, mintAsNFT } = (await req.json()) as RequestBody

    // Validate required fields
    if (!label || !emoji || !lens || !to?.accountId) {
      return NextResponse.json(
        { error: 'Missing required fields: label, emoji, lens, to.accountId' },
        { status: 400 }
      )
    }

    // Spend TRST for mint (~0.01 TRST per recognition)
    await settlementPort.spendTRST({
      accountId: fromAccount,
      amountTrst: LENS_MINT_PRICE_TRST,
      reason: 'recognition_mint',
      metadata: { label, lens, to: to.accountId }
    })

    // Publish immutable record to HCS
    const hcsResult = await publishHcs21({
      type: 'RECOGNITION_MINT',
      accountId: fromAccount,
      iat: new Date().toISOString(),
      payload: {
        label,
        emoji,
        description,
        lens,
        to,
        note,
        from: { accountId: fromAccount }
      }
    })

    // Store signal locally (dev cache until mirror reader is wired)
    const signal: RecognitionSignal = {
      id: randomUUID(),
      label,
      emoji,
      description,
      lens,
      from: { accountId: fromAccount },
      to,
      note,
      timestamp: new Date().toISOString(),
      txId: hcsResult?.topic ? `${hcsResult.topic}@${hcsResult.consensusTime}` : undefined
    }

    // Optional HTS NFT mint (stubbed service for now)
    if (mintAsNFT) {
      const { mintRecognitionNFT } = await import('@/lib/server/hts/nft')
      const nft = await mintRecognitionNFT({
        label,
        emoji,
        description,
        lens,
        metadata: {
          hcsMessageId: signal.txId,
          from: fromAccount,
          to: to.accountId,
          timestamp: signal.timestamp,
        },
      })
      signal.nftTokenId = nft.tokenId
      signal.nftSerialNumber = nft.serial
      console.log(`[recognition/create] Minted NFT: ${nft.tokenId} #${nft.serial}`)
    }
    
    await recognitionStore.add(signal)

    console.log(`[recognition/create] Minted ${label} (${lens}) from ${fromAccount} to ${to.accountId}`)

    return NextResponse.json({ ok: true, signal }, { status: 201 })
  } catch (error: any) {
    console.error('[API /recognition/create] Error:', error)
    const status = error?.status ?? 500
    return NextResponse.json(
      { error: error?.message ?? 'Mint failed' },
      { status }
    )
  }
}
