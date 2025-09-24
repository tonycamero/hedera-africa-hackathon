"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, ExternalLink, Clock, Users, Shield } from "lucide-react"
import { signalsStore, type SignalEvent } from "@/lib/stores/signalsStore"

interface MiniFeedProps {
  onViewAll?: () => void
}

export function MiniFeed({ onViewAll }: MiniFeedProps = {}) {
  const [recentSignals, setRecentSignals] = useState<SignalEvent[]>([])

  useEffect(() => {
    const updateSignals = () => {
      const signals = signalsStore.getRecentSignals(3)
      setRecentSignals(signals)
    }
    
    updateSignals()
    
    // Simple refresh every second
    const interval = setInterval(updateSignals, 1000)
    return () => clearInterval(interval)
  }, [])

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'CONTACT_REQUEST':
      case 'CONTACT_ACCEPT':
        return <Users className="h-3 w-3" />
      case 'TRUST_ALLOCATE':
      case 'TRUST_REVOKE':
        return <Shield className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'onchain':
        return 'bg-green-100 text-green-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const formatSignalDescription = (signal: SignalEvent) => {
    const fromShort = signal.actors.from.slice(-4)
    const toShort = signal.actors.to?.slice(-4) || 'unknown'

    switch (signal.type) {
      case 'CONTACT_REQUEST':
        return signal.direction === 'outbound' 
          ? `You sent request to ${toShort}` 
          : `Request from ${fromShort}`
      case 'CONTACT_ACCEPT':
        return signal.direction === 'outbound'
          ? `You accepted ${fromShort}`
          : `${fromShort} accepted you`
      case 'TRUST_ALLOCATE':
        return `Trust allocated to ${toShort} (${signal.payload?.weight || 1})`
      case 'TRUST_REVOKE':
        return `Trust revoked from ${toShort}`
      default:
        return signal.type.replace(/_/g, ' ').toLowerCase()
    }
  }

  const formatTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  if (recentSignals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500 text-center py-4">
          No recent activity. Add contacts or allocate trust to see updates here.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-blue-600" />
            Recent Activity
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => {
              if (onViewAll) {
                onViewAll()
              } else {
                console.log('Navigate to full signals feed')
              }
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentSignals.map((signal) => (
          <div key={signal.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
            <div className="flex items-center gap-1">
              {getSignalIcon(signal.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {formatSignalDescription(signal)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500">
                  {formatTimeAgo(signal.ts)}
                </span>
              </div>
            </div>
            <Badge className={`text-xs ${getStatusColor(signal.status)}`}>
              {signal.status === 'onchain' ? '✓' : signal.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}