'use client'

import React from 'react'

export interface GenZSignalCardProps {
  title: string
  template: string
  fill: string
  note?: string
  senderHandle: string
  recipientHandle: string
  rarity: "common" | "rare" | "epic" | "legendary"
  boostCount?: number
  emoji?: string
  timestamp?: string
  glowEffect?: boolean
  onClick?: () => void
}

const rarityConfig = {
  common: {
    gradient: "from-slate-400 to-slate-600",
    glow: "shadow-slate-500/20",
    border: "border-slate-300",
    text: "text-slate-700",
    bgGlow: "bg-slate-500/10",
  },
  rare: {
    gradient: "from-blue-400 to-cyan-500",
    glow: "shadow-blue-500/30",
    border: "border-blue-300",
    text: "text-blue-700",
    bgGlow: "bg-blue-500/10",
  },
  epic: {
    gradient: "from-purple-400 to-pink-500",
    glow: "shadow-purple-500/40",
    border: "border-purple-300",
    text: "text-purple-700",
    bgGlow: "bg-purple-500/10",
  },
  legendary: {
    gradient: "from-orange-400 to-red-500",
    glow: "shadow-orange-500/50",
    border: "border-orange-300",
    text: "text-orange-700",
    bgGlow: "bg-orange-500/10",
  },
}

const getRarityFromBoostCount = (boostCount: number): GenZSignalCardProps['rarity'] => {
  if (boostCount >= 100) return 'legendary'
  if (boostCount >= 50) return 'epic'
  if (boostCount >= 10) return 'rare'
  return 'common'
}

export function GenZSignalCard({
  title,
  template,
  fill,
  note,
  senderHandle,
  recipientHandle,
  rarity: providedRarity,
  boostCount = 0,
  emoji = "🔥",
  timestamp,
  glowEffect = false,
  onClick
}: GenZSignalCardProps) {
  const rarity = providedRarity || getRarityFromBoostCount(boostCount)
  const config = rarityConfig[rarity]
  const praiseText = template.replace('___', `"${fill}"`)
  
  // Accessibility and keyboard support
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      className={`
        relative bg-white rounded-xl border-2 ${config.border} 
        shadow-lg ${config.glow} md:hover:shadow-xl 
        transform md:hover:scale-105 transition-all duration-300
        motion-reduce:transition-none motion-reduce:animate-none
        ${glowEffect ? "md:animate-pulse" : ""}
        overflow-hidden cursor-pointer
        w-full max-w-sm sm:max-w-md lg:max-w-[300px]
        min-h-[280px] sm:min-h-[320px]
        mx-auto
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      aria-labelledby={`signal-card-${title}`}
      aria-describedby={`signal-content-${title}`}
    >
      {/* Rarity indicator */}
      <div
        className={`absolute top-3 right-3 px-3 py-2 sm:px-2 sm:py-1 min-h-[32px] sm:min-h-0 rounded-full bg-gradient-to-r ${config.gradient} text-white text-sm sm:text-xs font-bold uppercase tracking-wide z-10`}
        aria-label={`Rarity: ${rarity}`}
      >
        {rarity}
      </div>

      {/* Boost count badge */}
      {boostCount > 0 && (
        <div 
          className="absolute top-3 left-3 px-3 py-2 sm:px-2 sm:py-1 min-h-[32px] sm:min-h-0 rounded-full bg-black/20 md:backdrop-blur-sm text-white text-sm sm:text-xs font-bold z-10"
          aria-label={`${boostCount} boosts`}
        >
          🔥 {boostCount}
        </div>
      )}

      {/* Header section with gradient */}
      <div
        className={`h-28 sm:h-32 bg-gradient-to-br ${config.gradient} flex items-center justify-center relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/10 md:backdrop-blur-sm"></div>
        <div className="relative text-4xl sm:text-6xl font-bold text-white drop-shadow-lg">{emoji}</div>
        
        {/* Sparkle effects for legendary - only on desktop and when motion is allowed */}
        {rarity === "legendary" && (
          <>
            <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full md:animate-ping motion-reduce:animate-none"></div>
            <div className="absolute bottom-6 right-6 w-1 h-1 bg-white rounded-full md:animate-pulse motion-reduce:animate-none"></div>
            <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-white rounded-full md:animate-bounce motion-reduce:animate-none"></div>
            <div className="absolute top-12 left-8 w-1 h-1 bg-white rounded-full md:animate-pulse md:delay-300 motion-reduce:animate-none"></div>
          </>
        )}

        {/* Epic effects - only on desktop and when motion is allowed */}
        {rarity === "epic" && (
          <>
            <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-white rounded-full md:animate-pulse motion-reduce:animate-none"></div>
            <div className="absolute bottom-8 right-8 w-1 h-1 bg-white rounded-full md:animate-bounce motion-reduce:animate-none"></div>
          </>
        )}
      </div>

      {/* Content section */}
      <div className="p-4 sm:p-4 space-y-3 flex-1 flex flex-col">
        {/* Signal content */}
        <div className="flex-1" id={`signal-content-${title}`}>
          <blockquote className="font-sans font-bold text-base sm:text-lg text-black leading-tight mb-3 line-clamp-3">
            "{praiseText}"
          </blockquote>
          
          <div className="text-sm space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-white font-bold bg-blue-700 px-4 py-3 sm:px-3 sm:py-2 rounded-full text-sm sm:text-xs text-center">for @{recipientHandle}</span>
              <span className="text-white font-bold bg-purple-700 px-4 py-3 sm:px-3 sm:py-2 rounded-full text-sm sm:text-xs text-center">from @{senderHandle}</span>
            </div>
          </div>

          {note && (
            <div className="mt-3 p-3 rounded-lg bg-gray-800 border-2 border-gray-700">
              <p className="text-sm text-white leading-relaxed font-medium line-clamp-2">"{note}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm pt-3 border-t-2 border-gray-400 mt-2" id={`signal-card-${title}`}>
          <span className="font-bold text-black">{title}</span>
          {timestamp && <span className="font-medium text-black text-xs sm:text-sm">{new Date(timestamp).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Holographic effect overlay - only on desktop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 md:hover:opacity-100 transition-opacity duration-300 motion-reduce:transition-none pointer-events-none"></div>
      
      {/* Rare+ glow border effect - reduced on mobile */}
      {(rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${config.gradient} opacity-10 md:opacity-20 md:blur-sm -z-10 scale-105`} style={{ willChange: 'transform' }}></div>
      )}
    </div>
  )
}