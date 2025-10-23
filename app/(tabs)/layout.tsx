"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signalsStore } from "@/lib/stores/signalsStore"
import { HeaderModeChips } from "@/components/HeaderModeChips"
import { WalletFloatingButton } from "@/components/WalletFloatingButton"
import { useLayoutMode } from "@/lib/layout/useLayoutMode"
import { ModeShell } from "@/components/layout/ModeShell"
import type { UserTokens } from "@/lib/layout/token-types"
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
  // For now, stub with default values
  useEffect(() => {
    // Check auth status (replace with real auth check)
    const checkAuth = async () => {
      // Placeholder - wire to Magic.link or session cookies
      setIsAuthenticated(false)
      
      // Placeholder - wire to getUserTokens when authenticated
      // const tokens = await getUserTokens(wallet)
      // setUserTokens(tokens)
    }
    checkAuth()
  }, [])

  const mode = useLayoutMode({ isAuthenticated, userTokens })
  const collectionCount = userTokens?.nfts?.length ?? 0

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
      id: "inner-circle",
      label: "Circle",
      path: "/inner-circle",
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
    <ModeShell mode={mode} collectionCount={collectionCount}>
      <div className="min-h-screen">
        {/* Floating Wallet Button */}
        <WalletFloatingButton />

        {/* Main content - Add bottom padding for fixed navigation */}
        <main className="min-h-[calc(100vh-8rem)] px-1 pb-20">
          {children}
        </main>

        {/* Bottom navigation - Glass morphism */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10 z-40">
        <div className="max-w-2xl mx-auto px-4">
          {/* HeaderModeChips at top of bottom nav */}
          <div className="flex justify-center py-1">
            <HeaderModeChips />
          </div>
          
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname === tab.path
              
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-all duration-300 ${
                    isActive 
                      ? "text-white" 
                      : "text-white/60 hover:text-white/90"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 mb-1 transition-all duration-300 ${
                      isActive ? "text-[#00F6FF] scale-110" : "text-white/60"
                    }`} />
                    {tab.badge && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00F6FF] rounded-full pulse-accent" />
                    )}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#00F6FF] rounded-full" />
                    )}
                  </div>
                  <span className={`transition-all duration-300 text-xs ${
                    isActive ? "text-[#00F6FF] font-medium" : "text-white/60"
                  }`}>
                    {tab.label}
                  </span>
                </Link>
              )
            })}
            </div>
          </div>
        </nav>

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
    </ModeShell>
  )
}
