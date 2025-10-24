/**
 * VIPShell - Token-gated mode for legendary NFT holders
 * 
 * Unlocked by: networking-goat@1 NFT
 * Theme: Amber/gold gradient with premium chrome
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'

interface VIPShellProps {
  children: React.ReactNode
}

export function VIPShell({ children }: VIPShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900">
      {/* VIP Badge Header */}
      <div className="sticky top-0 z-50 border-b border-amber-700/30 bg-amber-950/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-600 text-amber-50 hover:bg-amber-500">
              🐐 VIP Access
            </Badge>
            <span className="text-sm text-amber-200">Legendary NFT Holder</span>
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
