import { signalsStore, type SignalEvent, type SignalStatus } from '../stores/signalsStore'
import { hederaClient } from '../../packages/hedera/HederaClient'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export interface StatusManagerOptions {
  retryConfig?: Partial<RetryConfig>
  enableAutoRetry?: boolean
  persistStatus?: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
}

export class SignalStatusManager {
  private retryConfig: RetryConfig
  private enableAutoRetry: boolean
  private persistStatus: boolean
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  private retryAttempts = new Map<string, number>()
  
  constructor(options: StatusManagerOptions = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig }
    this.enableAutoRetry = options.enableAutoRetry ?? true
    this.persistStatus = options.persistStatus ?? true
    
    this.loadPersistedRetryState()
  }

  /**
   * Submit a signal to HCS with automatic retry logic
   */
  async submitSignalWithRetry(signal: SignalEvent, topicId: string): Promise<void> {
    const signalId = signal.id
    
    try {
      // Mark as submitting
      this.updateSignalStatus(signalId, 'local')
      
      // Build envelope based on signal type
      const envelope = this.buildEnvelope(signal)
      
      // Submit to HCS
      await hederaClient.submitMessage(topicId, JSON.stringify(envelope))
      
      // Success - mark as onchain
      this.updateSignalStatus(signalId, 'onchain')
      this.clearRetryState(signalId)
      
      console.log('[StatusManager] Signal submitted successfully:', signalId)
      
    } catch (error) {
      console.error('[StatusManager] Signal submission failed:', signalId, error)
      
      if (this.enableAutoRetry) {
        this.scheduleRetry(signal, topicId, error as Error)
      } else {
        this.updateSignalStatus(signalId, 'error', error as Error)
      }
    }
  }

  /**
   * Retry failed signal submissions
   */
  async retryFailedSignals(): Promise<void> {
    const failedSignals = signalsStore.getSignals({ status: 'error' })
    
    console.log('[StatusManager] Retrying', failedSignals.length, 'failed signals')
    
    for (const signal of failedSignals) {
      // Skip if already at max retries
      const attempts = this.retryAttempts.get(signal.id) || 0
      if (attempts >= this.retryConfig.maxRetries) {
        continue
      }
      
      // Get appropriate topic ID based on signal class
      const topicId = this.getTopicForSignal(signal)
      if (!topicId) {
        console.warn('[StatusManager] No topic configured for signal class:', signal.class)
        continue
      }
      
      try {
        await this.submitSignalWithRetry(signal, topicId)
      } catch (error) {
        console.error('[StatusManager] Retry failed for signal:', signal.id, error)
      }
    }
  }

  /**
   * Get count of signals by status
   */
  getStatusCounts(): Record<SignalStatus, number> {
    const allSignals = signalsStore.getAllSignals()
    const counts: Record<SignalStatus, number> = {
      local: 0,
      onchain: 0,
      error: 0
    }
    
    for (const signal of allSignals) {
      counts[signal.status]++
    }
    
    return counts
  }

  /**
   * Clear all retry state for a signal
   */
  clearRetryState(signalId: string): void {
    const timeout = this.retryTimeouts.get(signalId)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(signalId)
    }
    
    this.retryAttempts.delete(signalId)
    this.persistRetryState()
  }

  /**
   * Get retry info for a signal
   */
  getRetryInfo(signalId: string): { attempts: number; maxRetries: number; willRetry: boolean } {
    const attempts = this.retryAttempts.get(signalId) || 0
    const willRetry = attempts < this.retryConfig.maxRetries && this.retryTimeouts.has(signalId)
    
    return {
      attempts,
      maxRetries: this.retryConfig.maxRetries,
      willRetry
    }
  }

  /**
   * Force retry a specific signal
   */
  async forceRetry(signalId: string): Promise<void> {
    const signal = signalsStore.getAllSignals().find(s => s.id === signalId)
    if (!signal) {
      throw new Error('Signal not found: ' + signalId)
    }
    
    const topicId = this.getTopicForSignal(signal)
    if (!topicId) {
      throw new Error('No topic configured for signal class: ' + signal.class)
    }
    
    // Clear existing retry state
    this.clearRetryState(signalId)
    
    // Reset attempts and retry
    this.retryAttempts.set(signalId, 0)
    await this.submitSignalWithRetry(signal, topicId)
  }

  /**
   * Cancel pending retries for a signal
   */
  cancelRetry(signalId: string): void {
    this.clearRetryState(signalId)
    this.updateSignalStatus(signalId, 'error', new Error('Retry cancelled by user'))
  }

  // Private methods

  private scheduleRetry(signal: SignalEvent, topicId: string, error: Error): void {
    const signalId = signal.id
    const attempts = (this.retryAttempts.get(signalId) || 0) + 1
    
    if (attempts > this.retryConfig.maxRetries) {
      console.log('[StatusManager] Max retries exceeded for signal:', signalId)
      this.updateSignalStatus(signalId, 'error', error)
      return
    }
    
    this.retryAttempts.set(signalId, attempts)
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempts - 1),
      this.retryConfig.maxDelay
    )
    
    console.log(`[StatusManager] Scheduling retry ${attempts}/${this.retryConfig.maxRetries} for signal ${signalId} in ${delay}ms`)
    
    // Schedule retry
    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(signalId)
      this.submitSignalWithRetry(signal, topicId)
    }, delay)
    
    this.retryTimeouts.set(signalId, timeout)
    this.persistRetryState()
    
    // Update signal status to indicate retry pending
    this.updateSignalStatus(signalId, 'local')
  }

  private updateSignalStatus(signalId: string, status: SignalStatus, error?: Error): void {
    signalsStore.updateSignalStatus(signalId, status)
    
    if (this.persistStatus) {
      // Persist error details if needed
      if (status === 'error' && error) {
        this.persistErrorInfo(signalId, error)
      }
    }
  }

  private buildEnvelope(signal: SignalEvent): any {
    const baseEnvelope = {
      type: signal.type,
      from: signal.actors.from,
      to: signal.actors.to,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: signal.payload || {},
      sig: 'demo_signature'
    }
    
    return baseEnvelope
  }

  private getTopicForSignal(signal: SignalEvent): string | null {
    // Import registry at usage to avoid circular deps
    const { getTopicRegistry } = require('@/lib/hooks/useTopicRegistry')
    const topics = getTopicRegistry()
    
    switch (signal.class) {
      case 'contact':
        return topics.contacts || null
      case 'trust':
        return topics.trust || null
      default:
        return null
    }
  }

  private persistRetryState(): void {
    if (!this.persistStatus) return
    
    try {
      const state = {
        retryAttempts: Object.fromEntries(this.retryAttempts.entries()),
        timestamp: Date.now()
      }
      localStorage.setItem('trustmesh_retry_state', JSON.stringify(state))
    } catch (error) {
      console.warn('[StatusManager] Failed to persist retry state:', error)
    }
  }

  private loadPersistedRetryState(): void {
    if (!this.persistStatus) return
    
    try {
      const stored = localStorage.getItem('trustmesh_retry_state')
      if (stored) {
        const state = JSON.parse(stored)
        
        // Only restore recent retry state (within last hour)
        if (Date.now() - state.timestamp < 3600000) {
          this.retryAttempts = new Map(Object.entries(state.retryAttempts || {}))
          console.log('[StatusManager] Restored retry state for', this.retryAttempts.size, 'signals')
        }
      }
    } catch (error) {
      console.warn('[StatusManager] Failed to load retry state:', error)
    }
  }

  private persistErrorInfo(signalId: string, error: Error): void {
    try {
      const errorInfo = {
        signalId,
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      }
      
      const existingErrors = JSON.parse(localStorage.getItem('trustmesh_signal_errors') || '[]')
      existingErrors.push(errorInfo)
      
      // Keep only last 50 errors
      const recentErrors = existingErrors.slice(-50)
      localStorage.setItem('trustmesh_signal_errors', JSON.stringify(recentErrors))
    } catch (err) {
      console.warn('[StatusManager] Failed to persist error info:', err)
    }
  }
}

// Singleton instance
export const signalStatusManager = new SignalStatusManager({
  enableAutoRetry: true,
  persistStatus: true,
  retryConfig: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }
})