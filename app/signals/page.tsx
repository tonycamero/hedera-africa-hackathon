'use client'

import { useEffect, useState } from 'react'
import { RecognitionSignalCard } from '@/components/recognition/RecognitionSignalCard'
import { magic } from '@/lib/magic'
import { RecognitionSignal } from '@/lib/recognition/types'
import AppShell from '@/components/layout/AppShell'
import { Loader2 } from 'lucide-react'

export default function SignalsPage() {
  const [signals, setSignals] = useState<RecognitionSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSignals()
  }, [])

  const fetchSignals = async () => {
    try {
      const token = await magic?.user.getIdToken()
      if (!token) {
        console.warn('[signals] No auth token')
        return
      }

      const res = await fetch('/api/recognition/list', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch signals: ${res.status}`)
      }

      const data = await res.json()
      setSignals(data.signals || [])
    } catch (err) {
      console.error('[signals] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell
      variant="main"
      title="Recognition Signals"
      subtitle="View all recognition signals you've sent and received"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-white/70 py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading signals…</span>
          </div>
        ) : signals.length > 0 ? (
          <div className="space-y-3">
            {signals.map((signal) => (
              <RecognitionSignalCard key={signal.txId || signal.id} signal={signal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60 mb-2">No recognition signals yet</p>
            <p className="text-white/40 text-sm">
              Send your first recognition to get started
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
