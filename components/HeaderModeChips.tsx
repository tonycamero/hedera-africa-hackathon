"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  getRuntimeFlags, 
  updateRuntimeFlags, 
  subscribeToFlagChanges, 
  resetFlags 
} from "@/lib/runtimeFlags"
import { resetSession } from "@/lib/session"
import { resetStorageAdapter } from "@/lib/store/storage"
import { signalsStore } from "@/lib/stores/signalsStore"
import { clearCache, beginCacheSession, configureCacheBackend } from "@/lib/cache/sessionCache"
import { assertDemoAllowed } from "@/lib/demo/guard"
import { RefreshCw, Eye, EyeOff, Globe, User, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export function HeaderModeChips() {
  const [flags, setFlags] = useState(getRuntimeFlags())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side to prevent hydration mismatch
    setIsClient(true)
    
    const unsubscribe = subscribeToFlagChanges(() => {
      setFlags(getRuntimeFlags())
    })
    return unsubscribe
  }, [])

  // Seed functionality removed in Step 5: Demo removal

  const toggleScope = () => {
    const newScope = flags.scope === 'global' ? 'my' : 'global'
    updateRuntimeFlags({ scope: newScope })
    toast.success(`Scope: ${newScope}`, { 
      description: newScope === 'global' ? "Showing all activity" : "Showing only your activity" 
    })
  }

  // Demo reset functionality removed in Step 5: Demo removal

  // Don't render anything on server-side to prevent hydration mismatch
  if (!isClient) {
    return null
  }
  
  // Show chips in demo mode or development
  const demoVisible =
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (!demoVisible) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Live/Demo indicator */}
      {flags.isLiveMode && (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          Live
        </Badge>
      )}
      {flags.isDemoMode && (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          Demo
        </Badge>
      )}

      {/* Seed toggle removed in Step 5 */}

      {/* Scope toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleScope}
        className="h-6 px-2 text-xs"
        title="Switch between global and personal activity view"
      >
        {flags.scope === 'global' ? <Globe className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
        {flags.scope === 'global' ? 'Global' : 'My'}
      </Button>

      {/* Reset button removed in Step 5 */}
    </div>
  )
}

export function DemoModeIndicator() {
  const [flags, setFlags] = useState(getRuntimeFlags())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side to prevent hydration mismatch
    setIsClient(true)
    
    const unsubscribe = subscribeToFlagChanges(() => {
      setFlags(getRuntimeFlags())
    })
    return unsubscribe
  }, [])

  // Don't render anything on server-side to prevent hydration mismatch
  if (!isClient) {
    return null
  }

  if (!flags.seedOn && !flags.isLiveMode && !flags.isDemoMode) {
    return null
  }

  return (
    <div className="text-xs text-slate-500 flex items-center gap-2">
      {flags.isLiveMode && <span className="text-green-600">● Live Mode</span>}
      {flags.isDemoMode && <span className="text-blue-600">● Demo Mode</span>}
      {flags.seedOn && <span className="text-orange-600">● Seed Data</span>}
      {flags.ephemeralStrict && <span className="text-purple-600">● Ephemeral</span>}
    </div>
  )
}
