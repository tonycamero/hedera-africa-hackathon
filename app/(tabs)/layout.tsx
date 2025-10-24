"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signalsStore } from "@/lib/stores/signalsStore"
import { HeaderModeChips } from "@/components/HeaderModeChips"
import { useLayoutMode } from "@/lib/layout/useLayoutMode"
import { ModeShell } from "@/components/layout/ModeShell"
import type { UserTokens } from "@/lib/layout/token-types"
import { TokenGatedProgress } from "@/components/gating/TokenGatedProgress"
import { UnlockModal } from "@/components/gating/UnlockModal"
import { useModeUpgrade } from "@/lib/layout/useModeUpgrade"
import { modeToUnlockKind } from "@/lib/layout/upgrade-map"
import { 
  Circle, 
  Activity, 
  Users
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

  // TODO: Wire to real auth/token detection
  // DEMO MODE: Uncomment below to test token-gated modes
  useEffect(() => {
    const checkAuth = async () => {
      // DEMO: Set to true to see token-gated features
      setIsAuthenticated(true)
      
      // DEMO: Uncomment ONE of these to test different modes:
      
      // Test Collector mode (10+ NFTs)
      setUserTokens({
        nfts: Array.from({ length: 10 }, (_, i) => `nft-${i}`),
        badges: [],
        memberships: [],
        trustLevel: 5
      })
      
      // Test Civic Leader mode (trust 9/9)
      // setUserTokens({
      //   nfts: [],
      //   badges: [],
      //   memberships: [],
      //   trustLevel: 9
      // })
      
      // Test VIP mode (legendary NFT)
      // setUserTokens({
      //   nfts: ['networking-goat@1'],
      //   badges: [],
      //   memberships: [],
      //   trustLevel: 5
      // })
      
      // Test Premium mode (PRO membership)
      // setUserTokens({
      //   nfts: [],
      //   badges: [],
      //   memberships: ['PRO_ANNUAL'],
      //   trustLevel: 5
      // })
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

  // GenZ navigation order: Friends → Circle → Signals (social campfire in the center)
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
    }
  ]

  return (
    <ModeShell 
      mode={mode} 
      collectionCount={collectionCount}
      isAuthenticated={isAuthenticated}
      signalsHasUnseen={hasUnseen}
    >
      <div className="min-h-screen">
        {/* Main content - Add bottom padding for fixed navigation */}
        <main className="min-h-[calc(100vh-8rem)] px-1 pb-20">
          {children}
        </main>

        {/* Professional Theme CSS Injection */}
        <style jsx global>{`
        .theme-professional {
          --accent-primary: #00F6FF;
          --bg-glass: rgba(30, 41, 59, 0.3);
          --border-glow: 0 0 4px rgba(0, 246, 255, 0.3);
        }
        
        .pulse-accent {
          animation: pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse-neon {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 2px rgba(0, 246, 255, 0.3));
          }
          50% {
            opacity: 0.7;
            filter: drop-shadow(0 0 4px rgba(0, 246, 255, 0.5));
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
