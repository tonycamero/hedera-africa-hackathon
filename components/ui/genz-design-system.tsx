/**
 * GenZ Design System Components
 * Dark Campus + Cyber Glow aesthetic
 * WCAG-compliant, motion-aware components
 */
import React from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// Base Component Interfaces
// =============================================================================

interface GenZButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'boost' | 'signal'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  children: React.ReactNode
}

interface GenZCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'panel' | 'glass' | 'elevated'
  glow?: boolean
  children: React.ReactNode
}

interface GenZInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface GenZChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'boost' | 'signal' | 'status' | 'neutral'
  count?: number
  children: React.ReactNode
}

// =============================================================================
// GenZ Button Component
// =============================================================================

export const GenZButton: React.FC<GenZButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    // Base styles
    "font-medium rounded-xl transition-all duration-norm ease-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
    "hover:scale-[1.02] active:scale-[0.98]",
    
    // Size variants
    {
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-sm': size === 'md',
      'px-6 py-3 text-base': size === 'lg',
    },

    // Style variants
    {
      // Primary (Boost) - Cyan - using bright colors for visibility
      'bg-pri-500 hover:bg-pri-glow text-slate-900 font-bold focus:ring-pri-glow/40': 
        variant === 'primary' || variant === 'boost',
      
      // Secondary (Signal) - Violet  
      'bg-sec-600 hover:bg-sec-500 text-white focus:ring-sec-500/40': 
        variant === 'secondary' || variant === 'signal',
      
      // Ghost
      'bg-transparent text-genz-text hover:bg-white/5 border border-white/5 focus:ring-pri-glow/20': 
        variant === 'ghost',
    },

    // Glow effect
    {
      'shadow-glow animate-breathe-glow': glow && (variant === 'primary' || variant === 'boost'),
      'shadow-glow-violet animate-breathe-glow': glow && (variant === 'secondary' || variant === 'signal'),
    },

    className
  )

  return (
    <button
      className={baseClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// =============================================================================
// GenZ Card Component  
// =============================================================================

export const GenZCard: React.FC<GenZCardProps> = ({
  variant = 'panel',
  glow = false,
  className,
  children,
  ...props
}) => {
  const baseClasses = cn(
    "rounded-2xl transition-all duration-norm",
    
    // Variant styles
    {
      // Standard panel
      'bg-panel/90 border border-genz-border shadow-panel': variant === 'panel',
      
      // Glass morphism
      'bg-panel/60 backdrop-blur-sm border border-white/10 shadow-card': variant === 'glass',
      
      // Elevated
      'bg-panel border border-genz-border shadow-modal': variant === 'elevated',
    },

    // Optional glow
    {
      'shadow-glow': glow,
    },

    className
  )

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  )
}

// =============================================================================
// GenZ Input Component
// =============================================================================

export const GenZInput: React.FC<GenZInputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  const inputClasses = cn(
    "w-full px-3 py-2 rounded-xl transition-all duration-fast",
    "bg-[#0E1520] border text-genz-text placeholder:text-genz-text-dim",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    
    // Border states
    error 
      ? "border-genz-danger focus:border-genz-danger focus:ring-genz-danger/20"
      : "border-[#1F2A37] focus:border-pri-500/60 focus:ring-pri-500/20",
    
    className
  )

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-genz-text">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="text-xs text-genz-danger">{error}</p>
      )}
    </div>
  )
}

// =============================================================================
// GenZ Chip Component
// =============================================================================

export const GenZChip: React.FC<GenZChipProps> = ({
  variant = 'neutral',
  count,
  className,
  children,
  ...props
}) => {
  const baseClasses = cn(
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-fast",
    
    // Variant styles
    {
      // Boost chip - Cyan
      'bg-pri-500/10 text-pri-glow border border-pri-500/20': variant === 'boost',
      'shadow-[inset_0_0_12px_rgba(34,211,238,0.25)]': variant === 'boost' && count,
      
      // Signal chip - Violet
      'bg-sec-500/10 text-sec-500 border border-sec-500/20': variant === 'signal',
      'shadow-[inset_0_0_12px_rgba(167,139,250,0.25)]': variant === 'signal' && count,
      
      // Status chip - Success
      'bg-genz-success/10 text-genz-success border border-genz-success/20': variant === 'status',
      
      // Neutral
      'bg-white/5 text-genz-text-dim border border-white/10': variant === 'neutral',
    },

    className
  )

  return (
    <div className={baseClasses} {...props}>
      {children}
      {count !== undefined && (
        <span className="font-mono font-bold tabular-nums">
          {count}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// GenZ Modal Component
// =============================================================================

interface GenZModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export const GenZModal: React.FC<GenZModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-fast"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-md",
        "bg-panel2 rounded-2xl border border-genz-border shadow-modal",
        "animate-in fade-in-0 zoom-in-95 duration-fast",
        className
      )}>
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-genz-border">
            <h2 className="text-lg font-semibold text-genz-text">{title}</h2>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// GenZ Template Tile Component
// =============================================================================

interface GenZTemplateTileProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean
  disabled?: boolean
  children: React.ReactNode
}

export const GenZTemplateTile: React.FC<GenZTemplateTileProps> = ({
  selected = false,
  disabled = false,
  className,
  children,
  ...props
}) => {
  const baseClasses = cn(
    "rounded-xl border transition-all duration-norm cursor-pointer",
    "bg-gradient-to-br from-[#0E1520] to-[#0B1018]",
    
    // States
    {
      'border-white/5 hover:border-pri-500/25': !selected && !disabled,
      'border-pri-500/60 outline outline-2 outline-pri-500/60': selected,
      'opacity-50 cursor-not-allowed': disabled,
    },

    className
  )

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  )
}

// =============================================================================
// GenZ Typography Components
// =============================================================================

export const GenZHeading: React.FC<{
  level: 1 | 2 | 3 | 4
  gradient?: boolean
  className?: string
  children: React.ReactNode
}> = ({ level, gradient = false, className, children }) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements
  
  const baseClasses = cn(
    "font-semibold tracking-tight",
    {
      'text-2xl leading-7': level === 1, // 24/28
      'text-xl leading-6': level === 2,  // 20/24  
      'text-lg leading-6': level === 3,  // 18/24
      'text-base leading-6': level === 4, // 16/24
    },
    gradient 
      ? "bg-gradient-to-r from-pri-glow via-sec-500 to-pri-glow bg-clip-text text-transparent opacity-40"
      : "text-genz-text",
    className
  )

  return React.createElement(Component, { className: baseClasses }, children)
}

export const GenZText: React.FC<{
  size?: 'sm' | 'base' | 'lg'
  dim?: boolean
  className?: string
  children: React.ReactNode
}> = ({ size = 'base', dim = false, className, children }) => {
  const baseClasses = cn(
    {
      'text-sm leading-5': size === 'sm',   // 13/18
      'text-base leading-6': size === 'base', // 15/22
      'text-lg leading-7': size === 'lg',
    },
    dim ? "text-genz-text-dim" : "text-genz-text",
    className
  )

  return <p className={baseClasses}>{children}</p>
}

// =============================================================================
// Utility Functions
// =============================================================================

export const genZClassNames = {
  // Background gradients
  heroGradient: "bg-gradient-to-br from-ink via-purple-900/20 to-blue-900/20",
  ctaGradient: "bg-gradient-to-r from-pri-600/8 to-sec-600/12",
  
  // Text gradients  
  textGradient: "bg-gradient-to-r from-pri-glow via-sec-500 to-pri-glow bg-clip-text text-transparent",
  
  // Grid lines
  gridLines: "bg-[#0E1621]/8",
  
  // Micro-motion presets
  hoverScale: "hover:scale-[1.02] transition-transform duration-fast",
  hoverGlow: "hover:shadow-glow transition-shadow duration-norm",
}

// Motion-safe utilities
export const useReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}