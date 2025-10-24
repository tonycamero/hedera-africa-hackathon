/**
 * CollectorShell - Token-gated mode for NFT collectors
 * 
 * Unlocked by: 10+ collectibles
 * Theme: Pink/fuchsia gradient with collection stats
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'

interface CollectorShellProps {
  children: React.ReactNode
  collectionCount?: number
}

export function CollectorShell({ children, collectionCount }: CollectorShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-pink-900 to-rose-900">
      {/* Collector Badge Header */}
      <div className="sticky top-0 z-50 border-b border-pink-700/30 bg-pink-950/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-pink-600 text-pink-50 hover:bg-pink-500">
              💎 Collector
            </Badge>
            {collectionCount && (
              <span className="text-sm text-pink-200">{collectionCount} Collectibles</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
