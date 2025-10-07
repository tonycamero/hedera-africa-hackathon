"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signalsStore } from "@/lib/stores/signalsStore"
import { HeaderModeChips } from "@/components/HeaderModeChips"
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
              {/* TrustMesh Network Logo */}
              <div className="w-8 h-8 flex items-center justify-center">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-white"
              >
                  <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M6 18L12 6L18 18" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 18L18 18" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">TrustMesh</h1>
                <p className="text-xs text-muted-foreground">
                  Community Builder Edition
                </p>
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