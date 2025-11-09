'use client'

import { ReactNode } from 'react'

/**
 * EmbedShell - Minimal chrome for iframe embedding
 * No navigation, no headers, transparent background
 */
export function EmbedShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      {children}
    </div>
  )
}
