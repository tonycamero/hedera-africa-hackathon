'use client'

import { ReactNode } from 'react'

/**
 * KioskShell - Simplified mode for kiosk/demo displays
 * Large touch targets, simplified navigation
 */
export function KioskShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      {/* Simplified header for kiosk mode */}
      <div className="p-6 text-center border-b border-white/20">
        <h1 className="text-4xl font-bold text-white">TrustMesh</h1>
        <p className="text-xl text-purple-200 mt-2">GenZ Social Network</p>
      </div>
      
      {/* Content with large touch targets */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
