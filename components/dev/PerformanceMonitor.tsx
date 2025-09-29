'use client'

import { useState, useEffect, useRef } from 'react'

interface PerformanceMonitorProps {
  componentName: string
  enabled?: boolean
}

/**
 * Development component for monitoring render performance
 * Only active in development mode
 */
export default function PerformanceMonitor({ 
  componentName, 
  enabled = process.env.NODE_ENV === 'development' 
}: PerformanceMonitorProps) {
  const renderCount = useRef(0)
  const [showStats, setShowStats] = useState(false)
  const lastRenderTime = useRef<number>(Date.now())

  useEffect(() => {
    if (!enabled) return

    renderCount.current++
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now

    // Warn about potential performance issues
    if (renderCount.current > 10 && timeSinceLastRender < 100) {
      console.warn(`[Perf] ${componentName}: High render frequency - ${renderCount.current} renders`)
    }

    // Auto-hide stats after 5 seconds
    if (showStats) {
      const timer = setTimeout(() => setShowStats(false), 5000)
      return () => clearTimeout(timer)
    }
  })

  if (!enabled) return null

  return (
    <div 
      className="fixed top-4 left-4 z-[9999] text-xs"
      onClick={() => setShowStats(!showStats)}
    >
      <div className="bg-black/80 text-white px-2 py-1 rounded cursor-pointer">
        📊 {componentName}
      </div>
      
      {showStats && (
        <div className="bg-black/90 text-white p-2 rounded mt-1 min-w-48">
          <div className="font-mono text-xs space-y-1">
            <div>Renders: {renderCount.current}</div>
            <div>Component: {componentName}</div>
            <div>Timestamp: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for tracking component performance
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const mountTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current++
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${componentName} render #${renderCount.current}`)
    }
  })

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current,
    uptime: Date.now() - mountTime.current
  }
}

// Component for displaying ingestion performance stats
export function IngestionPerformanceMonitor() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const updateStats = () => {
      if (typeof window !== 'undefined' && (window as any).trustmeshIngest) {
        setStats((window as any).trustmeshIngest.stats())
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!stats || process.env.NODE_ENV !== 'development') return null

  const totalMessages = Object.values(stats).reduce((sum: number, s: any) => sum + s.backfilled + s.streamed, 0)
  const totalErrors = Object.values(stats).reduce((sum: number, s: any) => sum + s.failed, 0)

  return (
    <div className="fixed bottom-20 left-4 z-[9999] bg-black/80 text-white p-3 rounded text-xs font-mono">
      <div className="font-semibold mb-2">Ingestion Stats</div>
      <div className="space-y-1">
        <div>Messages: {totalMessages}</div>
        <div>Errors: {totalErrors}</div>
        <div>Topics: {Object.keys(stats).length}</div>
        {Object.entries(stats).map(([topic, data]: [string, any]) => (
          <div key={topic} className="text-gray-300">
            {topic}: {data.backfilled + data.streamed} ({data.failed} err)
          </div>
        ))}
      </div>
    </div>
  )
}