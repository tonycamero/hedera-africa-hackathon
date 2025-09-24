"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { signalsStore } from "@/lib/stores/signalsStore"
import { HeaderModeChips, DemoModeIndicator } from "@/components/HeaderModeChips"
import { getRuntimeFlags } from "@/lib/runtimeFlags"
import { getSessionId } from "@/lib/session"
import { 
  Circle, 
  Activity, 
  Users, 
  Shield,
  Award
} from "lucide-react"

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [trustStats, setTrustStats] = useState({ allocatedOut: 0, cap: 9 })
  const [bondedCount, setBondedCount] = useState(0)
  const [hasUnseen, setHasUnseen] = useState(false)
  const [sessionId, setSessionId] = useState("")

  // Update stats periodically
  useEffect(() => {
    const currentSessionId = getSessionId()
    setSessionId(currentSessionId)
    
    const updateStats = () => {
      const stats = signalsStore.getTrustStats(currentSessionId)
      const bonded = signalsStore.getBondedContacts(currentSessionId)
      const unseen = signalsStore.hasUnseen("signals")
      
      setTrustStats(stats)
      setBondedCount(bonded.length)
      setHasUnseen(unseen)
    }

    // Load initially
    updateStats()

    // Update on storage changes
    const handleStorageChange = () => updateStats()
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for updates
    const interval = setInterval(updateStats, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const tabs = [
    {
      id: "circle",
      label: "Circle",
      path: "/circle",
      icon: Circle,
      badge: null
    },
    {
      id: "signals", 
      label: "Signals",
      path: "/signals",
      icon: Activity,
      badge: hasUnseen ? "•" : null
    },
    {
      id: "contacts",
      label: "Contacts", 
      path: "/contacts",
      icon: Users,
      badge: null
    }
  ]

  return (
    <div className="min-h-screen bg-background pb-16 theme-mesh-dark">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-primary">TrustMesh</h1>
                <p className="text-xs text-muted-foreground">
                  {sessionId} • {bondedCount}/9 bonded • {trustStats.allocatedOut}/{trustStats.cap} trust
                </p>
                <DemoModeIndicator />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <HeaderModeChips />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-8rem)]">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname === tab.path
              
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-colors ${
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 mb-1" />
                    {tab.badge && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </div>
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}