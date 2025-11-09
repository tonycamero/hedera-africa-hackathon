/**
 * Profile store - in-memory for now, migrate to DB later
 */

export type LensKey = 'base' | 'genz' | 'african'

export type Profile = {
  accountId: string
  displayName?: string
  bio?: string
  createdAt?: string
  lens?: {
    active: LensKey
    owned: LensKey[]
    lastSwitch?: string
    unlocks?: Record<string, string> // lens -> txId
  }
}

// In-memory store (replace with DB later)
const store = new Map<string, Profile>()

export const profileStore = {
  async get(accountId: string): Promise<Profile | null> {
    return store.get(accountId) || null
  },

  async set(accountId: string, profile: Profile): Promise<void> {
    store.set(accountId, profile)
  },

  async delete(accountId: string): Promise<void> {
    store.delete(accountId)
  },
}
