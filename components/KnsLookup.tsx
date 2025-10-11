"use client"

import { useState, useEffect, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Search, User, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { knsService } from "@/lib/services/knsService"

export interface KnsLookupResult {
  type: 'name' | 'account'
  value: string
  resolved?: string
  displayName?: string
  accountId?: string
  name?: string
}

interface KnsLookupProps {
  placeholder?: string
  onSelect?: (result: KnsLookupResult) => void
  onResolve?: (accountId: string, name?: string) => void
  disabled?: boolean
  className?: string
  showAvailabilityCheck?: boolean
  defaultValue?: string
}

export function KnsLookup({
  placeholder = "Enter @name.hbar or 0.0.xxxxx",
  onSelect,
  onResolve,
  disabled = false,
  className = "",
  showAvailabilityCheck = false,
  defaultValue = ""
}: KnsLookupProps) {
  const [input, setInput] = useState(defaultValue)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KnsLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState<boolean | null>(null)

  // Reset state when input changes
  useEffect(() => {
    if (input.trim()) {
      setError(null)
      setResult(null)
      setAvailable(null)
    }
  }, [input])

  // Check if KNS is enabled
  const knsEnabled = knsService.isEnabled()

  const handleResolve = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed) {
      setError("Please enter a name or account ID")
      return
    }

    if (!knsEnabled) {
      setError("KNS service is not enabled")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setAvailable(null)

    try {
      console.log(`[KnsLookup] Resolving identifier: ${trimmed}`)
      const resolved = await knsService.resolveIdentifier(trimmed)
      
      let lookupResult: KnsLookupResult

      if (resolved.type === 'account') {
        // It's an account ID
        lookupResult = {
          type: 'account',
          value: resolved.value,
          displayName: resolved.displayName,
          accountId: resolved.value,
          name: resolved.displayName
        }
      } else {
        // It's a name
        lookupResult = {
          type: 'name',
          value: resolved.value,
          resolved: resolved.resolved,
          accountId: resolved.resolved,
          name: resolved.value
        }

        // Check availability if requested and name wasn't resolved
        if (showAvailabilityCheck && !resolved.resolved) {
          try {
            const isAvailable = await knsService.checkAvailability(resolved.value)
            setAvailable(isAvailable)
          } catch (e) {
            console.warn('[KnsLookup] Availability check failed:', e)
          }
        }
      }

      setResult(lookupResult)
      
      // Call callbacks
      if (onSelect) {
        onSelect(lookupResult)
      }
      
      if (onResolve && lookupResult.accountId) {
        onResolve(lookupResult.accountId, lookupResult.name)
      }

      // Success toast
      if (lookupResult.type === 'name' && lookupResult.accountId) {
        toast.success("Name resolved", { 
          description: `${lookupResult.name} → ${lookupResult.accountId}` 
        })
      } else if (lookupResult.type === 'account' && lookupResult.displayName) {
        toast.success("Account found", { 
          description: `${lookupResult.accountId} → ${lookupResult.displayName}` 
        })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error("Lookup failed", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [input, knsEnabled, onSelect, onResolve, showAvailabilityCheck])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleResolve()
    }
  }

  const handleClear = () => {
    setInput("")
    setResult(null)
    setError(null)
    setAvailable(null)
  }

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
    if (error) return <XCircle className="w-4 h-4 text-red-500" />
    if (result?.accountId) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (available === false) return <XCircle className="w-4 h-4 text-red-500" />
    if (available === true) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Search className="w-4 h-4 text-slate-400" />
  }

  const getStatusText = () => {
    if (loading) return "Resolving..."
    if (error) return error
    if (result?.type === 'name' && result.accountId) {
      return `Resolved to ${result.accountId}`
    }
    if (result?.type === 'account' && result.displayName) {
      return `Known as ${result.displayName}`
    }
    if (available === true) return "Name is available"
    if (available === false) return "Name is taken"
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={`pr-8 ${error ? 'border-red-300 focus:border-red-500' : ''}`}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleResolve}
          disabled={disabled || loading || !input.trim()}
          variant="outline"
          size="sm"
        >
          <Search className="w-4 h-4 mr-1" />
          {loading ? "..." : "Look up"}
        </Button>

        {input.trim() && (
          <Button
            type="button"
            onClick={handleClear}
            disabled={disabled || loading}
            variant="ghost"
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Status and results */}
      {(getStatusText() || result) && (
        <div className="space-y-2">
          {/* Status text */}
          {getStatusText() && (
            <div className={`text-xs flex items-center gap-1 ${
              error ? 'text-red-600' : 
              result?.accountId ? 'text-green-600' : 
              available === true ? 'text-green-600' :
              available === false ? 'text-red-600' :
              'text-slate-500'
            }`}>
              {getStatusIcon()}
              {getStatusText()}
            </div>
          )}

          {/* Result details */}
          {result && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {result.type === 'name' ? result.name : result.displayName || 'Account'}
                  </div>
                  {result.accountId && (
                    <div className="text-xs text-slate-500 font-mono">
                      {result.accountId}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Badge variant={result.accountId ? 'default' : 'secondary'} className="text-xs">
                    {result.type === 'name' ? 'Name' : 'Account'}
                  </Badge>
                  {result.accountId && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Resolved
                    </Badge>
                  )}
                  {available === true && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Available
                    </Badge>
                  )}
                  {available === false && (
                    <Badge variant="outline" className="text-xs text-red-600">
                      Taken
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KNS disabled warning */}
      {!knsEnabled && (
        <div className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          KNS service is disabled. Only account IDs will work.
        </div>
      )}
    </div>
  )
}