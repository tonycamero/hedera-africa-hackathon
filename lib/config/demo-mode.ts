// Demo mode configuration for separating mock data from real HCS data

export type DemoMode = 'mock' | 'hcs' | 'hybrid'

export interface DemoConfig {
  mode: DemoMode
  enableMockSignals: boolean
  enableMockWallet: boolean
  enableMockInnerCircle: boolean
  enableHCS: boolean
}

// Default configuration - can be overridden by environment variables or user preference
const DEFAULT_CONFIG: DemoConfig = {
  mode: 'hybrid', // Show both by default for demo purposes
  enableMockSignals: true,
  enableMockWallet: true, 
  enableMockInnerCircle: false, // Inner circle uses real data
  enableHCS: true
}

class DemoModeManager {
  private config: DemoConfig = { ...DEFAULT_CONFIG }
  private listeners: Set<(config: DemoConfig) => void> = new Set()

  constructor() {
    // Initialize from environment variables if available
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('trustmesh_demo_mode')
      if (savedMode && ['mock', 'hcs', 'hybrid'].includes(savedMode)) {
        this.setMode(savedMode as DemoMode)
      }
    }

    // Override with environment variables in server contexts
    const envMode = process.env.NEXT_PUBLIC_DEMO_MODE
    if (envMode && ['mock', 'hcs', 'hybrid'].includes(envMode)) {
      this.setMode(envMode as DemoMode)
    }
  }

  getConfig(): DemoConfig {
    return { ...this.config }
  }

  getMode(): DemoMode {
    return this.config.mode
  }

  setMode(mode: DemoMode): void {
    this.config.mode = mode
    
    // Update feature flags based on mode
    switch (mode) {
      case 'mock':
        this.config.enableMockSignals = true
        this.config.enableMockWallet = true
        this.config.enableMockInnerCircle = true
        this.config.enableHCS = false
        break
      case 'hcs':
        this.config.enableMockSignals = false
        this.config.enableMockWallet = false
        this.config.enableMockInnerCircle = false
        this.config.enableHCS = true
        break
      case 'hybrid':
        this.config.enableMockSignals = true
        this.config.enableMockWallet = true
        this.config.enableMockInnerCircle = false // Keep inner circle real
        this.config.enableHCS = true
        break
    }

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('trustmesh_demo_mode', mode)
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(this.config))
  }

  subscribe(listener: (config: DemoConfig) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Helper methods for specific features
  shouldUseMockSignals(): boolean {
    return this.config.enableMockSignals
  }

  shouldUseMockWallet(): boolean {
    return this.config.enableMockWallet
  }

  shouldUseMockInnerCircle(): boolean {
    return this.config.enableMockInnerCircle
  }

  shouldUseHCS(): boolean {
    return this.config.enableHCS
  }

  getDataSourceLabel(feature: 'signals' | 'wallet' | 'inner-circle'): string {
    switch (feature) {
      case 'signals':
        return this.shouldUseMockSignals() ? 'Mock Data' : 'HCS Live'
      case 'wallet':
        return this.shouldUseMockWallet() ? 'Mock Data' : 'HCS Live'
      case 'inner-circle':
        return this.shouldUseMockInnerCircle() ? 'Mock Data' : 'HCS Live'
      default:
        return 'Unknown'
    }
  }

  getDataSourceBadgeColor(feature: 'signals' | 'wallet' | 'inner-circle'): string {
    switch (feature) {
      case 'signals':
        return this.shouldUseMockSignals() ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
      case 'wallet':
        return this.shouldUseMockWallet() ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
      case 'inner-circle':
        return this.shouldUseMockInnerCircle() ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
}

// Singleton instance
export const demoModeManager = new DemoModeManager()

// For server-side usage
export { demoModeManager as demoMode }
