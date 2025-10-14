'use client'

import React from 'react'
import type { EnhancedSignalType } from '@/lib/services/RecognitionEnrichmentService'
import { getRarityTheme, RARITY_THEMES } from '@/lib/ui/signal-rarities'
import { categoryDisplayName, typeIcon } from '@/lib/types/signals-collectible'

interface RecognitionCard3DProps {
  signal: EnhancedSignalType
  compact?: boolean
  onClick?: () => void
}

export default function RecognitionCard3D({ 
  signal, 
  compact = false, 
  onClick 
}: RecognitionCard3DProps) {
  const rarityTheme = getRarityTheme(signal.rarity)
  const categoryIcon = signal.icon || typeIcon[signal.category] || '🎯'
  const categoryName = categoryDisplayName[signal.category] || signal.category

  return (
    <div
      className={`
        group cursor-pointer select-none transform transition-transform duration-200 ease-out
        md:hover:scale-105 active:scale-95 motion-reduce:transform-none
        ${compact ? 'w-full aspect-[4/5]' : 'w-full max-w-sm aspect-[4/5] mx-auto'}
      `}
      onClick={onClick}
    >
      <div className={`
        relative h-full w-full rounded-2xl overflow-hidden
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        border-2 ${rarityTheme?.border || 'border-gray-500'}
        shadow-xl ${rarityTheme?.glow || 'shadow-gray-400/20'}
        md:hover:shadow-2xl motion-reduce:transform-none
        transition-all duration-300
        ${compact ? 'p-3' : 'p-4 sm:p-6'}
      `}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className={`
            absolute inset-0 
            bg-gradient-to-br ${rarityTheme?.gradient || 'from-gray-400 to-gray-600'}
          `} />
        </div>

        {/* Category Badge */}
        <div className={`
          absolute top-2 right-2 flex items-center gap-1 
          px-2 py-1 rounded-full text-xs font-medium
          bg-black/60 text-white
          ${compact ? 'text-xs' : 'text-sm'}
        `}>
          <span className="text-xs">{typeIcon[signal.category]}</span>
          <span className="capitalize">{signal.category}</span>
        </div>

        {/* Rarity Indicator */}
        <div className={`
          absolute top-2 left-2 
          w-3 h-3 rounded-full
          ${rarityTheme?.gradient ? `bg-gradient-to-r ${rarityTheme.gradient}` : 'bg-gray-500'}
          ${rarityTheme?.glow}
          ${signal.rarity === 'God-Tier' ? 'animate-pulse motion-reduce:animate-none' : ''}
        `} />

        {/* Main Content */}
        <div className="relative h-full flex flex-col justify-between">
          
          {/* Top Section - Icon & Name */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className={`
              text-6xl mb-3 filter drop-shadow-lg
              ${compact ? 'text-4xl mb-2' : 'text-6xl mb-3'}
            `}>
              {categoryIcon}
            </div>
            
            <h3 className={`
              font-bold text-white leading-tight
              ${compact ? 'text-sm' : 'text-base sm:text-lg'}
            `}>
              {signal.name}
            </h3>
            
            <p className={`
              text-slate-300 mt-1 line-clamp-2
              ${compact ? 'text-xs leading-tight' : 'text-sm'}
            `}>
              {signal.description}
            </p>
          </div>

          {/* Middle Section - Labels */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-wrap gap-1 justify-center">
              {signal.labels.slice(0, compact ? 3 : 4).map((label, idx) => (
                <span
                  key={idx}
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    bg-black/40 text-slate-300 border border-white/20
                    ${compact ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'}
                  `}
                >
                  {label.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Section - Rarity & Type ID */}
          <div className="text-center space-y-1">
            <div className={`
              font-semibold ${rarityTheme?.text || 'text-gray-300'}
              ${compact ? 'text-xs' : 'text-sm'}
            `}>
              {signal.rarity === 'Regular' ? '⚪ Regular' : 
               signal.rarity === 'Heat' ? '🔥 Heat' :
               signal.rarity === 'Peak' ? '💜 Peak' :
               signal.rarity === 'God-Tier' ? '✨ God-Tier' : signal.rarity}
            </div>
            
            <div className={`
              text-slate-500 font-mono tracking-wider
              ${compact ? 'text-xs' : 'text-xs'}
            `}>
              {signal.type_id}
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <div className="
          absolute inset-0 rounded-2xl
          bg-gradient-to-r from-transparent via-white/5 to-transparent
          translate-x-[-100%] md:group-hover:translate-x-[100%]
          transition-transform duration-1000 ease-out
          motion-reduce:transform-none
        " />
      </div>
    </div>
  )
}
