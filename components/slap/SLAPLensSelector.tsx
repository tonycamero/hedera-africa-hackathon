"use client"

/**
 * SLAP Lens Selector - Global lens toggle component
 * Persists user lens preference and can be embedded anywhere
 */

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { LensType } from '@/lib/hcs/slap-lens-manager'
import { Eye, Briefcase, Zap, Settings } from 'lucide-react'

interface SLAPLenseSelectorProps {
  currentLens?: LensType
  onLensChange?: (lens: LensType) => void
  compact?: boolean
  showLabels?: boolean
  className?: string
}

const LENS_CONFIG = {
  genz: {
    icon: Zap,
    label: 'GenZ',
    description: 'Social gaming perspective',
    color: 'pri-500',
    bgColor: 'bg-pri-500',
    textColor: 'text-pri-400'
  },
  professional: {
    icon: Briefcase,
    label: 'Professional',
    description: 'Business credentials focus',
    color: 'slate-500',
    bgColor: 'bg-slate-500',
    textColor: 'text-slate-400'
  },
  hybrid: {
    icon: Eye,
    label: 'Hybrid',
    description: 'Combined perspective',
    color: 'gradient',
    bgColor: 'bg-gradient-to-r from-pri-500 to-sec-500',
    textColor: 'text-pri-400'
  }
} as const

export const SLAPLensSelector: React.FC<SLAPLenseSelectorProps> = ({
  currentLens: propLens,
  onLensChange,
  compact = false,
  showLabels = true,
  className
}) => {
  const [selectedLens, setSelectedLens] = useState<LensType>(propLens || 'genz')
  const [isChanging, setIsChanging] = useState(false)

  // Load lens preference from localStorage on mount
  useEffect(() => {
    if (!propLens) {
      const savedLens = localStorage.getItem('slap-lens-preference') as LensType
      if (savedLens && ['genz', 'professional', 'hybrid'].includes(savedLens)) {
        setSelectedLens(savedLens)
      }
    }
  }, [propLens])

  // Update when prop changes
  useEffect(() => {
    if (propLens) {
      setSelectedLens(propLens)
    }
  }, [propLens])

  const handleLensChange = (lens: LensType) => {
    if (lens === selectedLens) return

    setIsChanging(true)
    setSelectedLens(lens)
    
    // Save preference to localStorage
    localStorage.setItem('slap-lens-preference', lens)
    
    // Call parent handler
    onLensChange?.(lens)

    // Reset changing state after animation
    setTimeout(() => setIsChanging(false), 300)
  }

  if (compact) {
    return (
      <div className={cn("flex bg-panel/50 rounded-xl p-1", className)}>
        {(Object.keys(LENS_CONFIG) as LensType[]).map((lens) => {
          const config = LENS_CONFIG[lens]
          const Icon = config.icon
          const isActive = selectedLens === lens
          
          return (
            <button
              key={lens}
              onClick={() => handleLensChange(lens)}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                isActive 
                  ? config.bgColor + " text-white shadow-lg scale-110" 
                  : "text-genz-text-dim hover:text-genz-text hover:bg-white/5",
                isChanging && "animate-pulse"
              )}
              title={`${config.label} - ${config.description}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Lens Toggle Buttons */}
      <div className="flex bg-panel/50 rounded-xl p-1">
        {(Object.keys(LENS_CONFIG) as LensType[]).map((lens) => {
          const config = LENS_CONFIG[lens]
          const Icon = config.icon
          const isActive = selectedLens === lens
          
          return (
            <button
              key={lens}
              onClick={() => handleLensChange(lens)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex-1 justify-center",
                isActive 
                  ? config.bgColor + " text-white shadow-lg" 
                  : "text-genz-text-dim hover:text-genz-text hover:bg-white/5",
                isChanging && "animate-pulse"
              )}
            >
              <Icon className="w-4 h-4" />
              {showLabels && <span>{config.label}</span>}
            </button>
          )
        })}
      </div>

      {/* Active Lens Description */}
      <div className={cn(
        "text-center text-xs transition-all duration-300",
        LENS_CONFIG[selectedLens].textColor
      )}>
        {LENS_CONFIG[selectedLens].description}
      </div>

      {/* Lens Change Indicator */}
      {isChanging && (
        <div className="flex items-center justify-center gap-2 text-xs text-genz-text-dim">
          <div className="w-1 h-1 bg-pri-500 rounded-full animate-ping" />
          <span>Switching perspective...</span>
          <div className="w-1 h-1 bg-pri-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
    </div>
  )
}

// Hook for lens state management
export const useSLAPLens = (initialLens?: LensType) => {
  const [currentLens, setCurrentLens] = useState<LensType>(initialLens || 'genz')

  useEffect(() => {
    const savedLens = localStorage.getItem('slap-lens-preference') as LensType
    if (savedLens && ['genz', 'professional', 'hybrid'].includes(savedLens)) {
      setCurrentLens(savedLens)
    }
  }, [])

  const changeLens = (lens: LensType) => {
    setCurrentLens(lens)
    localStorage.setItem('slap-lens-preference', lens)
  }

  return { currentLens, changeLens }
}

// Preset components for different contexts
export const SLAPLensSelectorHeader: React.FC<{ onLensChange?: (lens: LensType) => void }> = ({ onLensChange }) => (
  <SLAPLensSelector 
    compact 
    showLabels={false} 
    onLensChange={onLensChange}
    className="ml-auto"
  />
)

export const SLAPLensSelectorSidebar: React.FC<{ onLensChange?: (lens: LensType) => void }> = ({ onLensChange }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-medium text-genz-text">
      <Settings className="w-4 h-4" />
      <span>Perspective</span>
    </div>
    <SLAPLensSelector 
      onLensChange={onLensChange}
      showLabels
    />
  </div>
)