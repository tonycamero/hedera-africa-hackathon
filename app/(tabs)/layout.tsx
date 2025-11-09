"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signalsStore } from "@/lib/stores/signalsStore"
import { HeaderModeChips } from "@/components/HeaderModeChips"
import { useLayoutMode } from "@/lib/layout/useLayoutMode"
import { ModeShell } from "@/components/layout/ModeShell"
import { HeaderMenu } from "@/components/HeaderMenu"
import type { UserTokens } from "@/lib/layout/token-types"
import { TokenGatedProgress } from "@/components/gating/TokenGatedProgress"
import { UnlockModal } from "@/components/gating/UnlockModal"
import { useModeUpgrade } from "@/lib/layout/useModeUpgrade"
import { modeToUnlockKind } from "@/lib/layout/upgrade-map"
import { 
  Circle, 
  Activity, 
  Users,
  MessageCircle
} from "lucide-react"

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [hasUnseen, setHasUnseen] = useState(false)
  const [userTokens, setUserTokens] = useState<UserTokens | undefined>()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check auth from Magic wallet
  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is logged in via Magic
      const users = localStorage.getItem('tm:users')
      if (users) {
        const parsed = JSON.parse(users)
        setIsAuthenticated(parsed.length > 0)
      }
      
      // TODO: Wire to real token detection from Hedera account
      // For now, no special token-gated modes - just default App mode
      setUserTokens(undefined)
    }
    checkAuth()
  }, [])

  const mode = useLayoutMode({ isAuthenticated, userTokens })
  const collectionCount = userTokens?.nfts?.length ?? 0
  
  // Track mode upgrades and show unlock modal
  const { upgraded } = useModeUpgrade(mode)
  const unlockKind = upgraded ? modeToUnlockKind(mode) : null

  // Update unseen signals indicator
  useEffect(() => {
    const updateUnseen = () => {
      const unseen = signalsStore.hasUnseen()
      setHasUnseen(unseen)
    }

    // Load initially
    updateUnseen()

    // Update on storage changes
    const handleStorageChange = () => updateUnseen()
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for updates
    const interval = setInterval(updateUnseen, 5000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // GenZ navigation order: Friends → Circle → Signals → Messages
  const tabs = [
    {
      id: "contacts",
      label: "Friends",
      path: "/contacts",
      icon: Users,
      badge: null,
      description: "Add friends"
    },
    {
      id: "circle",
      label: "Circle",
      path: "/circle",
      icon: Circle,
      badge: null,
      description: "Trust campfire"
    },
    {
      id: "signals", 
      label: "Signals",
      path: "/signals",
      icon: Activity,
      badge: hasUnseen ? "•" : null,
      description: "Props activity"
    },
    {
      id: "messages",
      label: "Messages",
      path: "/messages",
      icon: MessageCircle,
      badge: null,
      description: "Direct messaging"
    }
  ]

  return (
    <ModeShell 
      mode={mode} 
      collectionCount={collectionCount}
      isAuthenticated={isAuthenticated}
      signalsHasUnseen={hasUnseen}
    >
      {/* Header menu across all modes */}
      <HeaderMenu />
      
      <div className="min-h-screen">
        {/* Main content - Add bottom padding for fixed navigation */}
        <main className="min-h-[calc(100vh-8rem)] px-1 pb-20">
          {children}
        </main>

        {/* Professional Theme CSS Injection */}
        <style jsx global>{`
        .theme-professional {
          --accent-primary: #FF6B35;
          --bg-glass: rgba(30, 41, 59, 0.3);
          --border-glow: 0 0 4px rgba(255, 107, 53, 0.3);
        }
        
        .pulse-accent {
          animation: pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse-neon {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 2px rgba(255, 107, 53, 0.3));
          }
          50% {
            opacity: 0.7;
            filter: drop-shadow(0 0 4px rgba(255, 107, 53, 0.5));
          }
        }
        
        .animate-spin-slow-cw {
          animation: spin-slow-cw 27s linear infinite;
        }
        
        .animate-spin-slow-ccw {
          animation: spin-slow-ccw 27s linear infinite;
        }
        
        @keyframes spin-slow-cw {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spin-slow-ccw {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        `}</style>
      </div>
      
      {/* Progress HUD (only when authenticated) */}
      {isAuthenticated && <TokenGatedProgress tokens={userTokens} />}

      {/* Unlock modal (fires on upgrade) */}
      <UnlockModal showFor={unlockKind} />
    </ModeShell>
  )
}
