export interface RuntimeFlags {
  seedOn: boolean
  scope: 'global' | 'my'
  ephemeralStrict: boolean
  isLiveMode: boolean
}

let _flags: RuntimeFlags | null = null
let _listeners: (() => void)[] = []

export function getRuntimeFlags(): RuntimeFlags {
  if (_flags) return _flags

  if (typeof window === 'undefined') {
    // Server-side defaults
    return {
      seedOn: false,
      scope: 'my',
      ephemeralStrict: true,
      isLiveMode: true
    }
  }

  _flags = {
    seedOn: false,
    scope: 'my',
    ephemeralStrict: true,
    isLiveMode: true
  }

  return _flags
}

export function updateRuntimeFlags(updates: Partial<RuntimeFlags>): void {
  if (!_flags) {
    _flags = getRuntimeFlags()
  }

  _flags = { ..._flags, ...updates }
  
  // Notify listeners
  _listeners.forEach(listener => listener())
}

export function subscribeToFlagChanges(listener: () => void): () => void {
  _listeners.push(listener)
  
  return () => {
    _listeners = _listeners.filter(l => l !== listener)
  }
}

export function resetFlags(): void {
  _flags = null
  _listeners.forEach(listener => listener())
}

// Environment flags (add these to .env.local)
export function getRequiredEnvFlags() {
  return `
# HCS Configuration
NEXT_PUBLIC_HCS_ENABLED=true
NEXT_PUBLIC_TOPIC_PROFILE=${process.env.NEXT_PUBLIC_TOPIC_PROFILE || '0.0.xxxxx'}
NEXT_PUBLIC_TOPIC_CONTACT=${process.env.NEXT_PUBLIC_TOPIC_CONTACT || '0.0.xxxxx'}
NEXT_PUBLIC_TOPIC_TRUST=${process.env.NEXT_PUBLIC_TOPIC_TRUST || '0.0.xxxxx'}
NEXT_PUBLIC_TOPIC_RECOGNITION=${process.env.NEXT_PUBLIC_TOPIC_RECOGNITION || '0.0.xxxxx'}
  `.trim()
}
