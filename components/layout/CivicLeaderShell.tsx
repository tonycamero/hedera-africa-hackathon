/**
 * CivicLeaderShell - Token-gated mode for trust leaders
 * 
 * Unlocked by: trustLevel >= 9 (Circle 9/9)
 * Theme: Blue/indigo gradient with leadership badges
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'

interface CivicLeaderShellProps {
  children: React.ReactNode
}

export function CivicLeaderShell({ children }: CivicLeaderShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      {/* Leader Badge Header */}
      <div className="sticky top-0 z-50 border-b border-indigo-700/30 bg-indigo-950/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-600 text-indigo-50 hover:bg-indigo-500">
              ⭐ Civic Leader
            </Badge>
            <span className="text-sm text-indigo-200">Trust Circle: 9/9</span>
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
