'use client'

import { useEffect, useState } from 'react'
import { GenZCard, GenZHeading, GenZText, GenZButton } from '@/components/ui/genz-design-system'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getHBARBalance } from '@/lib/services/hbarBalanceService'
import { getTRSTBalance } from '@/lib/services/trstBalanceService'
import { magic } from '@/lib/magic'
import { hashScanAccountUrl } from '@/lib/util/hashscan'
import { Loader2, RefreshCcw, Wallet, Link as LinkIcon, Save, User } from 'lucide-react'
import { toast } from 'sonner'

function ProfileEditor({ accountId }: { accountId: string | null }) {
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'contacts'>('public')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  // Load existing profile from localStorage
  useEffect(() => {
    const users = localStorage.getItem('tm:users')
    if (users) {
      try {
        const [u] = JSON.parse(users)
        if (u?.handle) setHandle(u.handle)
        if (u?.bio) setBio(u.bio)
        if (u?.visibility) setVisibility(u.visibility)
        if (u?.location) setLocation(u.location)
      } catch {}
    }
  }, [])

  async function saveProfile() {
    if (!accountId) {
      toast.error('No account ID available')
      return
    }

    if (!handle || handle.trim().length === 0) {
      toast.error('Handle is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: accountId,
          handle: handle.trim(),
          bio: bio.trim(),
          visibility,
          location: location.trim(),
          avatar: ''
        })
      })

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      // Update localStorage with new profile data
      const users = localStorage.getItem('tm:users')
      if (users) {
        try {
          const parsed = JSON.parse(users)
          const [u] = parsed
          if (u) {
            u.handle = handle.trim()
            u.bio = bio.trim()
            u.visibility = visibility
            u.location = location.trim()
            u.profileHrl = result.profileHrl
            localStorage.setItem('tm:users', JSON.stringify(parsed))
          }
        } catch {}
      }

      toast.success('Profile updated on HCS-11!', {
        description: `Sequence: ${result.sequenceNumber}`
      })
    } catch (error: any) {
      console.error('[ProfileEditor] Failed to save profile:', error)
      toast.error('Failed to update profile', {
        description: error.message || 'Please try again'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!accountId) {
    return <GenZText dim className="text-sm mt-1">Connect your account to edit profile.</GenZText>
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-white/70">Handle (Display Name)</label>
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="e.g., tony@, admin@"
          className="bg-white/5 border-white/10 text-white"
          maxLength={50}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/70">Bio</label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell others about yourself..."
          className="bg-white/5 border-white/10 text-white min-h-[80px]"
          maxLength={500}
        />
        <div className="text-xs text-white/40 text-right">{bio.length}/500</div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/70">Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., San Francisco, CA"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/70">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'public' | 'contacts')}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm"
        >
          <option value="public">Public (visible to everyone)</option>
          <option value="contacts">Contacts Only (visible to bonded contacts)</option>
        </select>
      </div>

      <GenZButton
        variant="primary"
        onClick={saveProfile}
        disabled={saving || !handle.trim()}
        className="w-full text-white border-2 border-white"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating on HCS-11...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Profile to HCS-11
          </>
        )}
      </GenZButton>

      <div className="text-xs text-white/50 text-center">
        Profile will be published to Hedera Consensus Service (HCS) topic 11
      </div>
    </div>
  )
}

export default function MePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [hbar, setHbar] = useState<number | null>(null)
  const [trst, setTrst] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet' ? 'mainnet' : 'testnet')

  useEffect(() => {
    const users = localStorage.getItem('tm:users')
    if (users) {
      try { 
        const [u] = JSON.parse(users)
        if (u?.email) setEmail(u.email)
        if (u?.hederaAccountId) {
          setAccountId(u.hederaAccountId)
          refreshBalances(u.hederaAccountId)
        }
      } catch {}
    }
  }, [])

  async function refreshBalances(aid?: string) {
    const id = aid || accountId
    if (!id) return
    setLoading(true)
    try {
      const [h, t] = await Promise.all([
        getHBARBalance(id),
        getTRSTBalance(id).then(r => r.balance),
      ])
      setHbar(h)
      setTrst(t)
      toast.success('Balances refreshed')
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to refresh balances')
    } finally {
      setLoading(false)
    }
  }

  async function topup() {
    if (!accountId) return
    try {
      const token = await magic?.user.getIdToken()
      const response = await fetch('/api/hedera/topup', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ accountId }),
      })
      
      if (!response.ok) {
        throw new Error('Top-up failed')
      }
      
      toast.success('HBAR top-up successful')
      await refreshBalances()
    } catch (e: any) {
      console.error(e)
      toast.error('Top-up failed')
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center mb-4">
          <GenZHeading level={2}>Your Account</GenZHeading>
          <GenZText dim className="text-sm">{email ?? 'Connected wallet'}</GenZText>
        </div>

        <GenZCard variant="glass" className="p-5 space-y-3">
          <GenZText dim className="text-xs">Hedera Account</GenZText>
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm text-white/90">{accountId ?? '—'}</div>
            {accountId && (
              <a
                className="text-xs text-[#00F6FF] hover:underline flex items-center gap-1"
                href={hashScanAccountUrl(accountId, network)}
                target="_blank" 
                rel="noreferrer"
              >
                <LinkIcon className="w-3 h-3" /> HashScan
              </a>
            )}
          </div>
        </GenZCard>

        <GenZCard variant="glass" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <GenZHeading level={4} className="flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Balances
            </GenZHeading>
            <button
              onClick={() => refreshBalances()}
              disabled={loading}
              className="text-xs text-white/70 hover:text-white flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />} Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-white/60">HBAR</div>
              <div className="text-lg font-semibold">{hbar !== null ? hbar.toFixed(4) : '—'}</div>
              <GenZText dim className="text-xs">for network fees</GenZText>
            </div>
            <div className="rounded-md bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-white/60">TRST/USD</div>
              <div className="text-lg font-semibold">{trst !== null ? trst.toFixed(2) : '—'}</div>
              <GenZText dim className="text-xs">platform tokens</GenZText>
            </div>
          </div>

          <div className="flex gap-2">
            <GenZButton 
              variant="primary" 
              onClick={topup}
              disabled={loading || !accountId}
            >
              Auto Top-Up HBAR
            </GenZButton>
            <GenZButton 
              variant="ghost" 
              onClick={() => refreshBalances()}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </GenZButton>
          </div>
        </GenZCard>

        <GenZCard variant="glass" className="p-5">
          <GenZHeading level={4}>Profile</GenZHeading>
          <ProfileEditor accountId={accountId} />
        </GenZCard>
      </div>
    </div>
  )
}
