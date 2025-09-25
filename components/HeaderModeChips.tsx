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
import { removeSeedData, SEED_TAG } from "@/lib/demo/seed"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
import { hcsRecognitionService } from "@/lib/services/HCSRecognitionService"
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

  const toggleSeed = async () => {
    const newSeedOn = !flags.seedOn
    console.log(`[HeaderModeChips] Toggling seed from ${flags.seedOn} to ${newSeedOn}`)
    
    updateRuntimeFlags({ seedOn: newSeedOn })
    
    if (!newSeedOn) {
      console.log("[HeaderModeChips] Disabling seed mode...")
      // Disable HCS seeding and clear data
      try {
        await hcsFeedService.disableSeedMode()
        console.log("[HeaderModeChips] HCS seed mode disabled")
      } catch (error) {
        console.error("[HeaderModeChips] Error disabling HCS seed mode:", error)
      }
      
      // Also clear any local data
      removeSeedData(signalsStore)
      signalsStore.clear()
      // Switch to 'my' scope when seed is off
      updateRuntimeFlags({ scope: 'my' })
      toast.success("Seed mode off", { description: "HCS demo data cleared, showing only your activity" })
    } else {
      console.log("[HeaderModeChips] Enabling seed mode...")
      // Enable HCS seeding
      try {
        toast.info("Initializing HCS services...", { description: "Creating topics and seeding data" })
        
        // Initialize HCS feed service first (this will also initialize recognition service)
        console.log("[HeaderModeChips] Checking if HCS feed service is ready...")
        if (!hcsFeedService.isReady()) {
          console.log("[HeaderModeChips] HCS feed service not ready, initializing...")
          await hcsFeedService.initialize()
          console.log("[HeaderModeChips] HCS feed service initialized")
        } else {
          console.log("[HeaderModeChips] HCS feed service already ready")
        }
        
        // Now enable seed mode
        await hcsFeedService.enableSeedMode()
        console.log("[HeaderModeChips] HCS seed mode enabled")
        
        toast.success("Seed mode on", { description: "HCS demo data loaded" })
        
        // Small delay to let HCS seed, then reload components
        setTimeout(() => {
          console.log("[HeaderModeChips] Reloading page after seed...")
          window.location.reload()
        }, 3000) // Increased delay to 3 seconds for HCS topics
      } catch (error) {
        console.error("[HeaderModeChips] Error enabling HCS seed mode:", error)
        toast.error("HCS initialization failed", { 
          description: error.message || "Check console for details" 
        })
      }
    }
  }

  const toggleScope = () => {
    const newScope = flags.scope === 'global' ? 'my' : 'global'
    updateRuntimeFlags({ scope: newScope })
    toast.success(`Scope: ${newScope}`, { 
      description: newScope === 'global' ? "Showing all activity" : "Showing only your activity" 
    })
  }

  const resetDemo = async () => {
    if (confirm("Reset all demo data? This will clear HCS topics, signals, and generate a new session ID.")) {
      // Reset HCS demo completely
      await hcsFeedService.resetDemo()
      
      // Clear local signals store
      signalsStore.clear()
      
      // Reset session
      resetSession()
      
      // Reset storage
      resetStorageAdapter()

      // Clear any previous browser cache and start a fresh cache session
      configureCacheBackend(false) // false = localStorage; set true to use sessionStorage
      clearCache()
      beginCacheSession() // starts a new sid and enables caching
      
      // Reset flags
      resetFlags()
      
      toast.success("Demo reset", { description: "All HCS and local data cleared" })
      
      // Redirect to live mode
      setTimeout(() => {
        window.location.href = window.location.pathname + "?live=1"
      }, 1000)
    }
  }

  // Don't render anything on server-side to prevent hydration mismatch
  if (!isClient) {
    return null
  }
  
  // Don't show chips in production or if disabled
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_DEMO_MODE) {
    return null
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

      {/* Seed toggle */}
      <Button
        variant={flags.seedOn ? "default" : "outline"}
        size="sm"
        onClick={toggleSeed}
        className="h-6 px-2 text-xs"
        title="Toggle demo activity data"
      >
        {flags.seedOn ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
        Seed
      </Button>

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

      {/* Reset button - only show in ephemeral strict mode */}
      {flags.ephemeralStrict && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetDemo}
          className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
          title="Reset all demo data and generate new session"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      )}
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
