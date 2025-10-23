/**
 * PremiumShell - Token-gated mode for premium members
 * 
 * Unlocked by: PRO_ANNUAL membership
 * Theme: Emerald/teal gradient with membership badge
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AppNav } from './AppNav'

interface PremiumShellProps {
  children: React.ReactNode
}

export function PremiumShell({ children }: PremiumShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
      {/* Premium Badge Header */}
      <div className="sticky top-0 z-50 border-b border-teal-700/30 bg-teal-950/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-teal-600 text-teal-50 hover:bg-teal-500">
              ✨ Premium
            </Badge>
            <span className="text-sm text-teal-200">Pro Member</span>
          </div>
          <AppNav />
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
