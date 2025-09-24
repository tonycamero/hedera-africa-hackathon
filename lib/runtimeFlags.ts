export interface RuntimeFlags {
  seedOn: boolean
  scope: 'global' | 'my'
  ephemeralStrict: boolean
  isLiveMode: boolean
  isDemoMode: boolean
}

let _flags: RuntimeFlags | null = null
let _listeners: (() => void)[] = []

export function getRuntimeFlags(): RuntimeFlags {
  if (_flags) return _flags

  if (typeof window === 'undefined') {
    // Server-side defaults
    return {
      seedOn: process.env.NEXT_PUBLIC_DEMO_SEED === "on",
      scope: (process.env.NEXT_PUBLIC_DEMO_SCOPE as 'global' | 'my') || 'global',
      ephemeralStrict: process.env.NEXT_PUBLIC_DEMO_EPHEMERAL_STRICT === "true",
      isLiveMode: false,
      isDemoMode: false
    }
  }

  const q = new URLSearchParams(window.location.search)
  const live = q.get("live") === "1"
  const seed = q.get("seed") === "1"

  _flags = {
    seedOn: live ? false : seed ? true : (process.env.NEXT_PUBLIC_DEMO_SEED === "on"),
    scope: live ? "my" : (process.env.NEXT_PUBLIC_DEMO_SCOPE as 'global' | 'my') || "global",
    ephemeralStrict: live ? true : (process.env.NEXT_PUBLIC_DEMO_EPHEMERAL_STRICT === "true"),
    isLiveMode: live,
    isDemoMode: seed
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
# Demo & visibility flags
NEXT_PUBLIC_DEMO_SEED=on           # on/off
NEXT_PUBLIC_DEMO_SCOPE=global      # global | my

# Ephemeral behavior
NEXT_PUBLIC_DEMO_EPHEMERAL_STRICT=true   # true => no persistence; reset on reload

# HCS
NEXT_PUBLIC_HCS_ENABLED=true       # optional; UI never blocks if false
NEXT_PUBLIC_TOPIC_PROFILE=${process.env.NEXT_PUBLIC_TOPIC_PROFILE || '11.x.x'}
NEXT_PUBLIC_TOPIC_CONTACT=${process.env.NEXT_PUBLIC_TOPIC_CONTACT || '11.x.x'}
NEXT_PUBLIC_TOPIC_TRUST=${process.env.NEXT_PUBLIC_TOPIC_TRUST || '11.x.x'}
  `.trim()
}