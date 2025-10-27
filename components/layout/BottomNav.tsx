'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Circle, Activity, Users } from 'lucide-react'

export function BottomNav({
  isAuthenticated,
  hasUnseen = false,
}: {
  isAuthenticated: boolean
  hasUnseen?: boolean
}) {
  const pathname = usePathname()

  // If unauth in viral/kiosk, send to /onboard
  const route = (path: string) => (isAuthenticated ? path : '/onboard')

  const tabs = [
    { id: 'contacts', label: 'Friends', path: route('/contacts'), icon: Users },
    { id: 'circle', label: 'Circle', path: route('/circle'), icon: Circle },
    {
      id: 'signals',
      label: 'Signals',
      path: route('/signals'),
      icon: Activity,
      badge: hasUnseen ? '•' : null,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10 z-40">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.path
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 mb-1 transition-all duration-300 ${
                      isActive ? 'text-[#FF6B35] scale-110' : 'text-white/60'
                    }`}
                  />
                  {tab.badge && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF6B35] rounded-full pulse-accent" />
                  )}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF6B35] rounded-full" />
                  )}
                </div>
                <span
                  className={`transition-all duration-300 text-xs ${
                    isActive ? 'text-[#FF6B35] font-medium' : 'text-white/60'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
