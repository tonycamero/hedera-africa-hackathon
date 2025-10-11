/**
 * Template Metrics Store
 * 
 * Persistent storage for template usage metrics
 * Uses file-based storage for simplicity, can be upgraded to Redis/KV later
 */

import { promises as fs } from 'fs'
import path from 'path'

export interface TemplateMetrics {
  templateId: string
  usageCount: number
  boostCount: number
  shareCount: number
  viralScore: number
  lastUsed: number
}

export class TemplateMetricsStore {
  private static metricsPath = path.join(process.cwd(), 'data', 'template-metrics.json')
  private static cache: Map<string, TemplateMetrics> = new Map()
  private static lastSync = 0
  private static readonly SYNC_INTERVAL = 60000 // Sync to disk every 60 seconds
  
  /**
   * Initialize the store and load existing metrics
   */
  static async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.metricsPath)
      await fs.mkdir(dataDir, { recursive: true })
      
      // Load existing metrics if file exists
      await this.loadFromDisk()
      
      console.log(`[TemplateMetricsStore] Initialized with ${this.cache.size} templates`)
    } catch (error) {
      console.warn('[TemplateMetricsStore] Failed to initialize:', error)
      // Continue with empty cache
    }
  }
  
  /**
   * Increment usage count for a template
   */
  static async incrUsage(templateId: string): Promise<void> {
    const metrics = this.getOrCreate(templateId)
    metrics.usageCount++
    metrics.lastUsed = Date.now()
    this.cache.set(templateId, metrics)
    await this.maybeSyncToDisk()
  }
  
  /**
   * Increment boost count for a template
   */
  static async incrBoost(templateId: string): Promise<void> {
    const metrics = this.getOrCreate(templateId)
    metrics.boostCount++
    this.cache.set(templateId, metrics)
    await this.maybeSyncToDisk()
  }
  
  /**
   * Increment share count for a template
   */
  static async incrShare(templateId: string): Promise<void> {
    const metrics = this.getOrCreate(templateId)
    metrics.shareCount++
    this.cache.set(templateId, metrics)
    await this.maybeSyncToDisk()
  }
  
  /**
   * Get metrics for a template
   */
  static getMetrics(templateId: string): TemplateMetrics {
    return this.cache.get(templateId) || this.getOrCreate(templateId)
  }
  
  /**
   * Get top N templates by viral score
   */
  static readTop(n: number = 10): TemplateMetrics[] {
    const metrics = Array.from(this.cache.values())
    return metrics
      .map(m => ({ ...m, viralScore: this.calculateViralScore(m) }))
      .sort((a, b) => b.viralScore - a.viralScore)
      .slice(0, n)
  }
  
  /**
   * Get all metrics
   */
  static getAllMetrics(): Map<string, TemplateMetrics> {
    // Return a copy to prevent external mutation
    return new Map(this.cache)
  }
  
  /**
   * Force sync to disk
   */
  static async syncToDisk(): Promise<void> {
    try {
      const data = Object.fromEntries(this.cache.entries())
      await fs.writeFile(this.metricsPath, JSON.stringify(data, null, 2), 'utf-8')
      this.lastSync = Date.now()
      console.log(`[TemplateMetricsStore] Synced ${this.cache.size} templates to disk`)
    } catch (error) {
      console.error('[TemplateMetricsStore] Failed to sync to disk:', error)
    }
  }
  
  /**
   * Load metrics from disk
   */
  private static async loadFromDisk(): Promise<void> {
    try {
      const data = await fs.readFile(this.metricsPath, 'utf-8')
      const parsed = JSON.parse(data)
      
      // Validate and load metrics
      for (const [templateId, metrics] of Object.entries(parsed)) {
        if (this.isValidMetrics(metrics)) {
          this.cache.set(templateId, metrics as TemplateMetrics)
        }
      }
      
      this.lastSync = Date.now()
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.warn('[TemplateMetricsStore] Failed to load from disk:', error)
      }
      // Continue with empty cache if file doesn't exist
    }
  }
  
  /**
   * Maybe sync to disk if enough time has passed
   */
  private static async maybeSyncToDisk(): Promise<void> {
    const now = Date.now()
    if (now - this.lastSync > this.SYNC_INTERVAL) {
      await this.syncToDisk()
    }
  }
  
  /**
   * Get or create metrics for a template
   */
  private static getOrCreate(templateId: string): TemplateMetrics {
    const existing = this.cache.get(templateId)
    if (existing) {
      return existing
    }
    
    const newMetrics: TemplateMetrics = {
      templateId,
      usageCount: 0,
      boostCount: 0,
      shareCount: 0,
      viralScore: 0,
      lastUsed: 0
    }
    
    return newMetrics
  }
  
  /**
   * Validate metrics object
   */
  private static isValidMetrics(obj: any): obj is TemplateMetrics {
    return obj && 
           typeof obj.templateId === 'string' &&
           typeof obj.usageCount === 'number' &&
           typeof obj.boostCount === 'number' &&
           typeof obj.shareCount === 'number' &&
           typeof obj.lastUsed === 'number'
  }
  
  /**
   * Calculate viral score from metrics
   */
  private static calculateViralScore(metrics: TemplateMetrics): number {
    const baseScore = metrics.usageCount
    const boostMultiplier = 1 + (metrics.boostCount * 0.5)
    const shareMultiplier = 1 + (metrics.shareCount * 2.0)
    
    return Math.floor(baseScore * boostMultiplier * shareMultiplier)
  }
  
  /**
   * Clear all metrics (useful for testing)
   */
  static clear(): void {
    this.cache.clear()
  }
  
  /**
   * Shutdown - force final sync to disk
   */
  static async shutdown(): Promise<void> {
    await this.syncToDisk()
    console.log('[TemplateMetricsStore] Shutdown complete')
  }
}

// Auto-initialize when imported
TemplateMetricsStore.initialize().catch(console.error)

// Graceful shutdown on process termination
process.on('SIGTERM', () => TemplateMetricsStore.shutdown())
process.on('SIGINT', () => TemplateMetricsStore.shutdown())
