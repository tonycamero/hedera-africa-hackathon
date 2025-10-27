'use client'

import { useEffect, useState } from 'react'
import { GenZCard, GenZHeading, GenZText, GenZButton } from '@/components/ui/genz-design-system'
import { getHBARBalance } from '@/lib/services/hbarBalanceService'
import { getTRSTBalance } from '@/lib/services/trstBalanceService'
import { magic } from '@/lib/magic'
import { hashScanAccountUrl } from '@/lib/util/hashscan'
import { Loader2, RefreshCcw, Wallet, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

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
          <GenZText dim className="text-sm mt-1">Profile editing coming soon.</GenZText>
        </GenZCard>
      </div>
    </div>
  )
}
