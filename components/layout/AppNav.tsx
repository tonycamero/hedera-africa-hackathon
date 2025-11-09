'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Circle, Activity, Users } from "lucide-react"

/**
 * AppNav - Tab navigation for authenticated app
 * Used in AppShell and token-gated shells
 */
export function AppNav() {
  const pathname = usePathname()

  const tabs = [
    {
      id: "contacts",
      label: "Friends",
      path: "/contacts",
      icon: Users,
    },
    {
      id: "circle",
      label: "Circle",
      path: "/circle",
      icon: Circle,
    },
    {
      id: "signals", 
      label: "Signals",
      path: "/signals",
      icon: Activity,
    }
  ]

  return (
    <nav className="flex items-center gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.path
        
        return (
          <Link
            key={tab.id}
            href={tab.path}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${ 
              isActive 
                ? "bg-white/20 text-white" 
                : "text-white/60 hover:text-white/90 hover:bg-white/10"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
