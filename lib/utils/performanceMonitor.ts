/**
 * Performance monitoring utility for HCS data processing
 * Helps identify and prevent excessive function calls
 */

interface PerformanceMetric {
  functionName: string
  callCount: number
  totalTime: number
  averageTime: number
  lastCalled: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private callLimits: Map<string, { limit: number; window: number }> = new Map()
  private enabled = process.env.NODE_ENV === 'development'

  constructor() {
    // Set default call limits for critical functions
    this.setCallLimit('getBondedContactsFromHCS', 10, 5000) // Max 10 calls per 5 seconds
    this.setCallLimit('getTrustStatsFromHCS', 10, 5000) 
    this.setCallLimit('getPersonalMetricsFromHCS', 10, 5000)
  }

  setCallLimit(functionName: string, limit: number, windowMs: number) {
    this.callLimits.set(functionName, { limit, window: windowMs })
  }

  track<T>(functionName: string, fn: () => T): T {
    if (!this.enabled) return fn()

    const startTime = performance.now()
    const now = Date.now()

    // Check if we're exceeding call limits
    const callLimit = this.callLimits.get(functionName)
    if (callLimit) {
      const metric = this.metrics.get(functionName)
      if (metric) {
        const timeSinceLastCall = now - metric.lastCalled
        if (timeSinceLastCall < callLimit.window && metric.callCount >= callLimit.limit) {
          console.warn(
            `🚨 [PerformanceMonitor] Function "${functionName}" called ${metric.callCount} times in ${timeSinceLastCall}ms (limit: ${callLimit.limit}/${callLimit.window}ms)`
          )
        }
      }
    }

    try {
      const result = fn()
      this.recordCall(functionName, performance.now() - startTime, now)
      return result
    } catch (error) {
      this.recordCall(functionName, performance.now() - startTime, now, true)
      throw error
    }
  }

  private recordCall(functionName: string, executionTime: number, timestamp: number, errored = false) {
    const existing = this.metrics.get(functionName)
    
    if (existing) {
      existing.callCount++
      existing.totalTime += executionTime
      existing.averageTime = existing.totalTime / existing.callCount
      existing.lastCalled = timestamp
    } else {
      this.metrics.set(functionName, {
        functionName,
        callCount: 1,
        totalTime: executionTime,
        averageTime: executionTime,
        lastCalled: timestamp
      })
    }

    // Log if function is taking too long
    if (executionTime > 100) {
      console.warn(
        `⏱️ [PerformanceMonitor] Slow function "${functionName}": ${executionTime.toFixed(2)}ms${errored ? ' (errored)' : ''}`
      )
    }
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).sort((a, b) => b.callCount - a.callCount)
  }

  getReport(): string {
    const metrics = this.getMetrics()
    const lines = [
      '📊 HCS Performance Report',
      '========================',
      ''
    ]
    
    metrics.forEach(metric => {
      lines.push(
        `${metric.functionName}:`,
        `  Calls: ${metric.callCount}`,
        `  Total time: ${metric.totalTime.toFixed(2)}ms`,
        `  Average: ${metric.averageTime.toFixed(2)}ms`,
        `  Last called: ${new Date(metric.lastCalled).toLocaleTimeString()}`,
        ''
      )
    })

    return lines.join('\n')
  }

  reset() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Utility function to wrap functions with performance tracking
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  functionName: string,
  fn: T
): T {
  return ((...args: any[]) => {
    return performanceMonitor.track(functionName, () => fn(...args))
  }) as T
}

// Debug helper
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.hcsPerformance = {
    getReport: () => console.log(performanceMonitor.getReport()),
    getMetrics: () => performanceMonitor.getMetrics(),
    reset: () => performanceMonitor.reset()
  }
}