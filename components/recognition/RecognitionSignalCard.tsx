'use client'

import { RecognitionSignal } from '@/lib/recognition/types'
import { LENSES } from '@/lib/lens/lensConfig'
import { Card } from '@/components/ui/kit'

type Props = {
  signal: RecognitionSignal
}

/**
 * Recognition signal card
 * 
 * Renders FROZEN metadata from mint time - no lens overlay applied.
 * Everyone sees the exact same label/emoji/description.
 */
export function RecognitionSignalCard({ signal }: Props) {
  return (
    <Card className="p-4 bg-panel border-white/10">
      <div className="flex items-start gap-3">
        {/* Frozen emoji from mint time */}
        <div className="text-2xl leading-none">{signal.emoji}</div>
        
        <div className="flex-1">
          {/* Frozen label from mint time */}
          <div className="text-white font-semibold">{signal.label}</div>
          
          {/* Frozen description from mint time */}
          {signal.description && (
            <div className="text-xs text-white/60 mt-0.5">{signal.description}</div>
          )}
          
          {/* Personal note from sender */}
          {signal.note && (
            <div className="mt-2 text-white/80 italic border-l-2 border-white/20 pl-3">
              "{signal.note}"
            </div>
          )}
          
          {/* Metadata footer */}
          <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
            <span>from {signal.from.handle || signal.from.accountId}</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1">
              {LENSES[signal.lens].emoji}
              <span>via {LENSES[signal.lens].label} lens</span>
            </span>
            <span className="text-white/30">•</span>
            <span>{new Date(signal.timestamp).toLocaleDateString()}</span>
            {signal.nftTokenId && typeof signal.nftSerialNumber === 'number' && (
              <>
                <span className="text-white/30">•</span>
                <span className="uppercase tracking-wide text-purple-400 font-semibold">
                  NFT #{signal.nftSerialNumber}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
