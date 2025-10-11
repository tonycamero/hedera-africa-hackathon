'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassTokenCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function GlassTokenCard({ children, className, onClick }: GlassTokenCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl backdrop-blur bg-white/5 ring-1 ring-white/10 shadow-lg p-3',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}