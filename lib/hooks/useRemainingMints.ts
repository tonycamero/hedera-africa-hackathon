"use client"

import { useEffect, useState } from "react"
import { TRST_PRICING } from "@/lib/config/pricing"

export function useRemainingMints(accountId: string | null) {
  const [loading, setLoading] = useState(true)
  const [trstBalance, setTrstBalance] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const cost = TRST_PRICING.RECOGNITION_MINT
  const remainingMints = Math.max(0, Math.floor(trstBalance / cost))
  const percentage = Math.min(100, (remainingMints / 135) * 100) // 135 from initial 1.35 TRST stipend
  const needsTopUp = remainingMints <= 27 && remainingMints > 0

  async function refresh() {
    if (!accountId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/trst/balance?accountId=${encodeURIComponent(accountId)}`,
        { cache: "no-store" }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setTrstBalance(data?.balance ?? 0)
    } catch (err: any) {
      console.error("[useRemainingMints] Failed to fetch balance:", err)
      setError(err.message || "Failed to fetch balance")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [accountId])

  return {
    loading,
    error,
    trstBalance,
    remainingMints,
    percentage,
    cost,
    needsTopUp,
    refresh
  }
}
