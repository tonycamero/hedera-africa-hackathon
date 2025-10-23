'use client'

import { ReactNode } from 'react'

/**
 * AppShell - Full app chrome with tabs and navigation
 * Used for authenticated core app experience
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      {/* App chrome is already in layout.tsx - this is a pass-through */}
      {/* In future, we can move tab navigation here */}
      {children}
    </div>
  )
}
