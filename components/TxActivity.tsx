"use client"

import { useEffect, useState } from "react"
import { getRecentTxs, TxLogEvent, clearTxLogsClient } from "@/lib/telemetry/txLog"
import { getHashScanTxUrl } from "@/lib/util/hashscan"
import { Button } from "@/components/ui/button"

export function TxActivity({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<TxLogEvent[]>([])

  function load() {
    setItems(getRecentTxs(limit))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [limit])

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-white">Recent Activity</div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={load} 
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { 
              clearTxLogsClient()
              load() 
            }} 
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Clear
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-white/60 text-sm">No recent transactions</div>
      ) : (
        <div className="space-y-2">
          {items.map((e, idx) => {
            const timestamp = e.timestamp || e.ts || Date.now()
            return (
              <div key={idx} className="p-2 rounded-md bg-black/30 border border-white/10">
                <div className="text-white text-sm">
                  {e.action} 
                  <span className={`ml-2 ${
                    e.status === 'SUCCESS' ? 'text-emerald-400' :
                    e.status === 'PENDING' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    • {e.status}
                  </span>
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {new Date(timestamp).toLocaleString()}
                </div>
                {e.txId && (
                  <a
                    href={getHashScanTxUrl(e.txId)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-300 hover:underline mt-1 inline-block"
                  >
                    View on HashScan →
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
