'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { BottomNav } from '@/components/layout/BottomNav'

type AppShellProps = {
  children: React.ReactNode
  title?: string
  subtitle?: string
  /** Use 'auth' for login/onboarding; hides BottomNav and centers content. */
  variant?: 'default' | 'auth'
  /** Optional topbar slot if you have a global header */
  topbar?: React.ReactNode
  className?: string
}

export default function AppShell({
  children,
  title,
  subtitle,
  variant = 'default',
  topbar,
  className,
}: AppShellProps) {
  const isAuth = variant === 'auth'

  return (
    <div className={cn('min-h-screen bg-ink flex flex-col', className)}>
      {/* Optional global header */}
      {topbar ?? null}

      <main
        className={cn(
          'flex-1',
          isAuth ? 'flex items-center justify-center' : 'pt-4'
        )}
      >
        <div
          className={cn(
            'w-full',
            // hard align with app's content containers:
            'max-w-md mx-auto px-4',
            // auth pages usually look like modals-on-canvas:
            isAuth ? '' : 'pb-24'
          )}
        >
          {title ? (
            <header className="mb-6">
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
              {subtitle ? (
                <p className="text-sm text-white/70 mt-1">{subtitle}</p>
              ) : null}
            </header>
          ) : null}

          {children}
        </div>
      </main>

      {/* Hide nav for auth/onboarding so users can't escape the flow early */}
      {!isAuth ? <BottomNav /> : null}
    </div>
  )
}
