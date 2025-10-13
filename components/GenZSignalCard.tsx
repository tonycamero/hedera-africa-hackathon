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

  return (
    <div
      className={`
        relative bg-white rounded-xl border-2 ${config.border} 
        shadow-lg ${config.glow} hover:shadow-xl 
        transform hover:scale-105 transition-all duration-300
        ${glowEffect ? "animate-pulse" : ""}
        overflow-hidden cursor-pointer
        min-h-[320px] max-w-[300px]
      `}
      onClick={onClick}
    >
      {/* Rarity indicator */}
      <div
        className={`absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white text-xs font-bold uppercase tracking-wide z-10`}
      >
        {rarity}
      </div>

      {/* Boost count badge */}
      {boostCount > 0 && (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white text-xs font-bold z-10">
          🔥 {boostCount}
        </div>
      )}

      {/* Header section with gradient */}
      <div
        className={`h-32 bg-gradient-to-br ${config.gradient} flex items-center justify-center relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative text-6xl font-bold text-white drop-shadow-lg">{emoji}</div>
        
        {/* Sparkle effects for legendary */}
        {rarity === "legendary" && (
          <>
            <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-ping"></div>
            <div className="absolute bottom-6 right-6 w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
            <div className="absolute top-12 left-8 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
          </>
        )}

        {/* Epic effects */}
        {rarity === "epic" && (
          <>
            <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 right-8 w-1 h-1 bg-white rounded-full animate-bounce"></div>
          </>
        )}
      </div>

      {/* Content section */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Signal content */}
        <div className="flex-1">
          <blockquote className="font-serif font-black text-lg text-black leading-tight mb-3 italic">
            "{praiseText}"
          </blockquote>
          
          <div className="text-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white font-bold bg-blue-700 px-3 py-2 rounded-full text-xs">for @{recipientHandle}</span>
              <span className="text-white font-bold bg-purple-700 px-3 py-2 rounded-full text-xs">from @{senderHandle}</span>
            </div>
          </div>

          {note && (
            <div className="mt-3 p-3 rounded-lg bg-gray-800 border-2 border-gray-700">
              <p className="text-sm text-white italic leading-relaxed font-medium">"{note}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm pt-3 border-t-2 border-gray-400 mt-2">
          <span className="font-black text-black">GenZ Signal</span>
          {timestamp && <span className="font-bold text-black">{new Date(timestamp).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Holographic effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {/* Rare+ glow border effect */}
      {(rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${config.gradient} opacity-20 blur-sm -z-10 scale-105`}></div>
      )}
    </div>
  )
}