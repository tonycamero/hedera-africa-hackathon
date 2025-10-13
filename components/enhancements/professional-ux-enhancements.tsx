"use client"

/**
 * Professional UX Enhancement Components
 * Adds professional-grade patterns to existing GenZ flows without changing routes
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { GenZButton, GenZCard, GenZText } from '@/components/ui/genz-design-system'
import { AlertCircle, CheckCircle2, Info, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'

// === ENHANCED LOADING STATES ===
interface ProfessionalLoadingProps {
  message?: string
  submessage?: string
  variant?: 'default' | 'initial' | 'refresh' | 'action'
  showProgress?: boolean
  progress?: number
  className?: string
}

export const ProfessionalLoading: React.FC<ProfessionalLoadingProps> = ({
  message = "Loading...",
  submessage,
  variant = 'default',
  showProgress = false,
  progress = 0,
  className
}) => {
  const icons = {
    default: <Loader2 className="w-5 h-5 animate-spin text-pri-500" />,
    initial: <div className="text-4xl mb-2 animate-float">⚡</div>,
    refresh: <RefreshCw className="w-5 h-5 animate-spin text-pri-500" />,
    action: <div className="w-5 h-5 bg-pri-500 rounded-full animate-pulse" />
  }

  return (
    <div className={cn("text-center py-8", className)}>
      <div className="flex flex-col items-center gap-3">
        {icons[variant]}
        
        <GenZText className="font-medium">{message}</GenZText>
        
        {submessage && (
          <GenZText size="sm" dim>{submessage}</GenZText>
        )}
        
        {showProgress && (
          <div className="w-full max-w-xs">
            <div className="bg-panel/30 rounded-full h-2">
              <div 
                className="bg-pri-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <GenZText size="sm" dim className="mt-1">{Math.round(progress)}%</GenZText>
          </div>
        )}
      </div>
    </div>
  )
}

// === ENHANCED ERROR HANDLING ===
interface ProfessionalErrorProps {
  title?: string
  message: string
  actionText?: string
  onAction?: () => void
  variant?: 'error' | 'warning' | 'info' | 'network'
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export const ProfessionalError: React.FC<ProfessionalErrorProps> = ({
  title,
  message,
  actionText = "Try Again",
  onAction,
  variant = 'error',
  dismissible = false,
  onDismiss,
  className
}) => {
  const config = {
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      titleColor: 'text-red-400'
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      titleColor: 'text-yellow-400'
    },
    info: {
      icon: <Info className="w-5 h-5 text-pri-400" />,
      bgColor: 'bg-pri-500/10',
      borderColor: 'border-pri-500/30',
      titleColor: 'text-pri-400'
    },
    network: {
      icon: <WifiOff className="w-5 h-5 text-gray-400" />,
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      titleColor: 'text-gray-400'
    }
  }

  const styles = config[variant]

  return (
    <GenZCard 
      variant="panel"
      className={cn(
        "p-4 border-l-4",
        styles.bgColor,
        styles.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        
        <div className="flex-1 min-w-0">
          {title && (
            <GenZText className={cn("font-medium mb-1", styles.titleColor)}>
              {title}
            </GenZText>
          )}
          
          <GenZText size="sm" className="text-genz-text-dim">
            {message}
          </GenZText>
          
          {onAction && (
            <div className="mt-3">
              <GenZButton 
                size="sm" 
                variant="ghost" 
                onClick={onAction}
                className="border border-white/20"
              >
                {actionText}
              </GenZButton>
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </GenZCard>
  )
}

// === CONTEXTUAL GUIDANCE TOOLTIPS ===
interface ContextualGuideProps {
  title: string
  message: string
  tip?: string
  actionText?: string
  onAction?: () => void
  onDismiss?: () => void
  showOnce?: boolean
  storageKey?: string
  className?: string
}

export const ContextualGuide: React.FC<ContextualGuideProps> = ({
  title,
  message,
  tip,
  actionText,
  onAction,
  onDismiss,
  showOnce = false,
  storageKey,
  className
}) => {
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    if (showOnce && storageKey) {
      const wasDismissed = localStorage.getItem(`guide-${storageKey}`) === 'true'
      setDismissed(wasDismissed)
    }
  }, [showOnce, storageKey])

  const handleDismiss = () => {
    if (showOnce && storageKey) {
      localStorage.setItem(`guide-${storageKey}`, 'true')
    }
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <GenZCard 
      variant="glass"
      className={cn("p-4 relative border-l-4 border-pri-500", className)}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-pri-500/20 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-pri-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <GenZText className="font-semibold text-pri-400 mb-1">
            {title}
          </GenZText>
          
          <GenZText size="sm" className="mb-2">
            {message}
          </GenZText>
          
          {tip && (
            <GenZText size="sm" className="text-genz-text-dim italic">
              💡 {tip}
            </GenZText>
          )}
          
          <div className="flex items-center gap-2 mt-3">
            {actionText && onAction && (
              <GenZButton 
                size="sm" 
                variant="boost"
                onClick={onAction}
              >
                {actionText}
              </GenZButton>
            )}
            
            <GenZButton 
              size="sm" 
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs"
            >
              Got it
            </GenZButton>
          </div>
        </div>
      </div>
    </GenZCard>
  )
}

// === PROFESSIONAL SUCCESS FEEDBACK ===
interface ProfessionalSuccessProps {
  title?: string
  message: string
  details?: string[]
  actionText?: string
  onAction?: () => void
  autoHide?: boolean
  hideDelay?: number
  className?: string
}

export const ProfessionalSuccess: React.FC<ProfessionalSuccessProps> = ({
  title,
  message,
  details,
  actionText,
  onAction,
  autoHide = false,
  hideDelay = 3000,
  className
}) => {
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => setVisible(false), hideDelay)
      return () => clearTimeout(timer)
    }
  }, [autoHide, hideDelay])

  if (!visible) return null

  return (
    <GenZCard 
      variant="glass"
      className={cn(
        "p-4 border-l-4 border-green-500 bg-green-500/10",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {title && (
            <GenZText className="font-medium text-green-400 mb-1">
              {title}
            </GenZText>
          )}
          
          <GenZText size="sm" className="mb-2">
            {message}
          </GenZText>
          
          {details && details.length > 0 && (
            <ul className="text-sm text-genz-text-dim space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {detail}
                </li>
              ))}
            </ul>
          )}
          
          {actionText && onAction && (
            <div className="mt-3">
              <GenZButton 
                size="sm" 
                variant="boost"
                onClick={onAction}
              >
                {actionText}
              </GenZButton>
            </div>
          )}
        </div>
      </div>
    </GenZCard>
  )
}

// === NETWORK STATUS INDICATOR ===
export const NetworkStatusIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className={cn(
      "fixed top-16 left-4 right-4 z-50 mx-auto max-w-md",
      className
    )}>
      <ProfessionalError
        variant="network"
        message="You're offline. Some features may not work."
        actionText="Retry"
        onAction={() => window.location.reload()}
      />
    </div>
  )
}

// === PULL-TO-REFRESH ENHANCEMENT ===
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  className?: string
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className
}) => {
  const [isPulling, setIsPulling] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const startY = React.useRef(0)
  const currentY = React.useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return

    currentY.current = e.touches[0].clientY
    const distance = Math.max(0, currentY.current - startY.current)
    
    if (distance > 0) {
      setPullDistance(distance)
      setIsPulling(distance > threshold / 2)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
    setIsPulling(false)
  }

  return (
    <div 
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-pri-500/10 z-10 transition-transform duration-200"
          style={{ 
            transform: `translateY(${isRefreshing ? '0px' : `-${Math.max(0, threshold - pullDistance)}px`})` 
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2 text-pri-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Refreshing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-pri-400">
              <div className="text-sm">
                {isPulling ? 'Release to refresh' : 'Pull to refresh'}
              </div>
            </div>
          )}
        </div>
      )}
      
      {children}
    </div>
  )
}