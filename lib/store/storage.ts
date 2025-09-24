import { getRuntimeFlags } from '../runtimeFlags'

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

class MemoryStorage implements StorageAdapter {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) || null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }
}

class NamespacedSessionStorage implements StorageAdapter {
  private namespace = 'tm/'

  private getKey(key: string): string {
    return `${this.namespace}${key}`
  }

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(this.getKey(key))
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(this.getKey(key), value)
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(this.getKey(key))
  }

  clear(): void {
    if (typeof window === 'undefined') return
    
    // Clear only our namespaced items
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(this.namespace)) {
        sessionStorage.removeItem(key)
      }
    })
  }
}

let _storageAdapter: StorageAdapter | null = null

export function createStorageAdapter(): StorageAdapter {
  if (_storageAdapter) return _storageAdapter

  const flags = getRuntimeFlags()
  
  if (flags.ephemeralStrict) {
    _storageAdapter = new MemoryStorage()
  } else {
    _storageAdapter = new NamespacedSessionStorage()
  }

  return _storageAdapter
}

export function resetStorageAdapter(): void {
  if (_storageAdapter) {
    _storageAdapter.clear()
  }
  _storageAdapter = null
}

// Helper functions that use the current adapter
export function storeGet(key: string): string | null {
  return createStorageAdapter().getItem(key)
}

export function storeSet(key: string, value: string): void {
  createStorageAdapter().setItem(key, value)
}

export function storeRemove(key: string): void {
  createStorageAdapter().removeItem(key)
}

export function storeClear(): void {
  createStorageAdapter().clear()
}