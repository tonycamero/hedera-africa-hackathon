'use client'

import { useState, useEffect } from 'react'
import { demoModeManager, DemoConfig, DemoMode } from '@/lib/config/demo-mode'

// React hook for components
export function useDemoMode() {
  const [config, setConfig] = useState<DemoConfig>(demoModeManager.getConfig())

  useEffect(() => {
    return demoModeManager.subscribe(setConfig)
  }, [])

  return {
    config,
    mode: config.mode,
    setMode: (mode: DemoMode) => demoModeManager.setMode(mode),
    shouldUseMockSignals: () => config.enableMockSignals,
    shouldUseMockWallet: () => config.enableMockWallet,
    shouldUseMockInnerCircle: () => config.enableMockInnerCircle,
    shouldUseHCS: () => config.enableHCS,
    getDataSourceLabel: (feature: 'signals' | 'wallet' | 'inner-circle') => 
      demoModeManager.getDataSourceLabel(feature),
    getDataSourceBadgeColor: (feature: 'signals' | 'wallet' | 'inner-circle') => 
      demoModeManager.getDataSourceBadgeColor(feature)
  }
}