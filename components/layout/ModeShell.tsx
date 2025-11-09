/**
 * ModeShell - Central shell switcher
 * 
 * Routes to the appropriate layout shell based on detected mode
 * Renders universal bottom nav for all modes except embed
 */

import React from 'react'
import type { LayoutMode } from '@/lib/layout/mode-detector'
import AppShell from './AppShell'
import { ViralShell } from './ViralShell'
import { EmbedShell } from './EmbedShell'
import { KioskShell } from './KioskShell'
import { VIPShell } from './VIPShell'
import { CivicLeaderShell } from './CivicLeaderShell'
import { CollectorShell } from './CollectorShell'
import { PremiumShell } from './PremiumShell'
import { BottomNav } from './BottomNav'

interface ModeShellProps {
  mode: LayoutMode
  children: React.ReactNode
  collectionCount?: number
  isAuthenticated?: boolean
  signalsHasUnseen?: boolean
}

export function ModeShell({ 
  mode, 
  children, 
  collectionCount,
  isAuthenticated = false,
  signalsHasUnseen = false
}: ModeShellProps) {
  const shell = (() => {
    switch (mode) {
      case 'app':
        return <AppShell>{children}</AppShell>
      
      case 'viral':
        return <ViralShell>{children}</ViralShell>
      
      case 'embed':
        return <EmbedShell>{children}</EmbedShell>
      
      case 'kiosk':
        return <KioskShell>{children}</KioskShell>
      
      case 'vip':
        return <VIPShell>{children}</VIPShell>
      
      case 'civic-leader':
        return <CivicLeaderShell>{children}</CivicLeaderShell>
      
      case 'collector':
        return <CollectorShell collectionCount={collectionCount}>{children}</CollectorShell>
      
      case 'premium':
        return <PremiumShell>{children}</PremiumShell>
      
      default:
        return <AppShell>{children}</AppShell>
    }
  })()

  // Show bottom nav in all modes except embed
  const showBottomNav = mode !== 'embed'

  return (
    <div data-layout-mode={mode}>
      {shell}
      {showBottomNav && (
        <BottomNav isAuthenticated={isAuthenticated} hasUnseen={signalsHasUnseen} />
      )}
    </div>
  )
}
