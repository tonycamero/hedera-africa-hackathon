"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Filter, Search, Users, Shield, Clock, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react"
import { signalsStore, type SignalEvent, type SignalClass, type SignalStatus } from "@/lib/stores/signalsStore"
import { hcsFeedService } from "@/lib/services/HCSFeedService"

type FilterState = {
  search: string
  class: SignalClass | 'all'
  status: SignalStatus | 'all'  
  direction: 'inbound' | 'outbound' | 'all'
}

export function SignalsFeed() {
  const [signals, setSignals] = useState<SignalEvent[]>([])
  const [filteredSignals, setFilteredSignals] = useState<SignalEvent[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    class: 'all',
    status: 'all',
    direction: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Load and refresh signals from HCS only
  useEffect(() => {
    const updateSignals = async () => {
      try {
        // Load ONLY from HCS - no local storage
        const hcsSignals = await hcsFeedService.getAllFeedEvents()
        
        setSignals(hcsSignals.sort((a, b) => b.ts - a.ts))
        console.log(`[SignalsFeed] Loaded ${hcsSignals.length} HCS events (pure HCS mode)`)
      } catch (error) {
        console.error("[SignalsFeed] Failed to load HCS events:", error)
        setSignals([]) // No fallback - pure HCS mode
      }
    }
    
    updateSignals()
    const interval = setInterval(updateSignals, 5000) // Check every 5s for new HCS events
    return () => clearInterval(interval)
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...signals]

    // Search filter (handle, type, or peerId)
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(s => 
        s.type.toLowerCase().includes(search) ||
        s.actors.from.toLowerCase().includes(search) ||
        s.actors.to?.toLowerCase().includes(search) ||
        s.payload?.handle?.toLowerCase().includes(search) ||
        s.payload?.name?.toLowerCase().includes(search)
      )
    }

    // Class filter
    if (filters.class !== 'all') {
      filtered = filtered.filter(s => s.class === filters.class)
    }

    // Status filter  
    if (filters.status !== 'all') {
      filtered = filtered.filter(s => s.status === filters.status)
    }

    // Direction filter
    if (filters.direction !== 'all') {
      filtered = filtered.filter(s => s.direction === filters.direction)
    }

    setFilteredSignals(filtered)
  }, [signals, filters])

  const getSignalIcon = (signal: SignalEvent) => {
    switch (signal.class) {
      case 'contact':
        return <Users className="h-4 w-4" />
      case 'trust':
        return <Shield className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: SignalStatus) => {
    switch (status) {
      case 'onchain':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'local':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getDirectionIcon = (direction: 'inbound' | 'outbound') => {
    return direction === 'inbound' 
      ? <ArrowDownLeft className="h-3 w-3 text-blue-600" />
      : <ArrowUpRight className="h-3 w-3 text-green-600" />
  }

  const formatSignalDescription = (signal: SignalEvent) => {
    const fromShort = signal.actors.from.slice(-6)
    const toShort = signal.actors.to?.slice(-6) || 'unknown'
    const handle = signal.payload?.handle || signal.payload?.name

    switch (signal.type) {
      case 'CONTACT_REQUEST':
        return signal.direction === 'outbound' 
          ? `Sent contact request to ${handle || toShort}` 
          : `Contact request from ${handle || fromShort}`
      case 'CONTACT_ACCEPT':
        return signal.direction === 'outbound'
          ? `Accepted request from ${handle || toShort}`
          : `${handle || fromShort} accepted your request`
      case 'TRUST_ALLOCATE':
        return `Trust allocated to ${handle || toShort} (weight: ${signal.payload?.weight || 1})`
      case 'TRUST_REVOKE':
        return `Trust revoked from ${handle || toShort}`
      default:
        return signal.type.replace(/_/g, ' ').toLowerCase()
    }
  }

  const formatRelativeTime = (ts: number) => {
    const now = Date.now()
    const seconds = Math.floor((now - ts) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Header with filter toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Signal Activity</h2>
          <Badge variant="secondary" className="text-xs">
            {filteredSignals.length} signals
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const hcsSignals = await hcsFeedService.getAllFeedEvents()
                setSignals(hcsSignals.sort((a, b) => b.ts - a.ts))
                console.log(`[SignalsFeed] Manual refresh: ${hcsSignals.length} HCS events loaded (pure HCS)`)
              } catch (error) {
                console.error("[SignalsFeed] Manual refresh failed:", error)
                setSignals([])
              }
            }}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <Input
                    placeholder="Type, handle, or ID..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Class</label>
                <Select value={filters.class} onValueChange={(value) => setFilters(prev => ({ ...prev, class: value as any }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="onchain">On-chain</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Direction</label>
                <Select value={filters.direction} onValueChange={(value) => setFilters(prev => ({ ...prev, direction: value as any }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directions</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signals feed */}
      <div className="space-y-2">
        {filteredSignals.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <Activity className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No signals match your filters</p>
              <p className="text-xs text-slate-400 mt-1">
                {signals.length === 0 ? 'No signal activity yet' : 'Try adjusting your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSignals.map((signal) => (
            <Card key={signal.id} className="border-slate-200 hover:border-slate-300 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 mt-1">
                    {getSignalIcon(signal)}
                    {getDirectionIcon(signal.direction)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {formatSignalDescription(signal)}
                      </p>
                      <Badge className={`text-xs border ${getStatusColor(signal.status)}`}>
                        {signal.status === 'onchain' ? '✓' : signal.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(signal.ts)}</span>
                      </div>
                      <div className="truncate">
                        {signal.class} · {signal.type}
                      </div>
                      {signal.payload?.weight && (
                        <div>Weight: {signal.payload.weight}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}