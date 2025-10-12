/**
 * Robust ingestion boot singleton with global state and retry logic
 * Prevents multiple initialization attempts and handles startup failures gracefully
 */

type BootState = {
  started: boolean
  starting: boolean
  lastError?: string
  lastAttempt?: number
  attempts: number
}

// Global state persistence across hot reloads
const g = globalThis as any
if (!g.__tm_ingestion) {
  g.__tm_ingestion = { 
    started: false, 
    starting: false,
    attempts: 0
  } as BootState
}
export const ingestState: BootState = g.__tm_ingestion

/**
 * Boot ingestion with retries and singleton protection
 * @param startIngestion Function that starts the actual ingestion system
 * @param depsReady Function that checks prerequisites (mirror ping, env, etc)
 */
export async function bootIngestionOnce(
  startIngestion: () => Promise<void>, 
  depsReady: () => Promise<void>
): Promise<BootState> {
  
  if (ingestState.started || ingestState.starting) {
    return ingestState
  }
  
  ingestState.starting = true
  ingestState.lastAttempt = Date.now()

  const log = (msg: string, meta: any = {}) =>
    console.log(`[HCS Boot] ${msg}`, { 
      ...meta, 
      started: ingestState.started,
      attempts: ingestState.attempts 
    })

  try {
    log('Starting ingestion boot process...')
    
    // Wait for async prerequisites (registry, env, mirror ping, etc.)
    log('Checking dependencies...')
    await depsReady()
    log('Dependencies ready')

    // Retry wrapper (handles mirror hiccups on cold start)
    let attempts = 0
    const maxAttempts = 5
    let delay = 600
    
    while (attempts < maxAttempts) {
      attempts++
      ingestState.attempts = attempts
      
      try {
        log(`Attempt ${attempts}/${maxAttempts}: Starting ingestion...`)
        await startIngestion()
        
        ingestState.started = true
        ingestState.starting = false
        ingestState.lastError = undefined
        
        log('✅ Ingestion started successfully', { attempts })
        return ingestState
        
      } catch (e: any) {
        const errorMsg = e?.message || String(e)
        ingestState.lastError = errorMsg
        
        log(`❌ Attempt ${attempts} failed: ${errorMsg}`)
        
        if (attempts < maxAttempts) {
          log(`Retrying in ${delay}ms...`)
          await new Promise(r => setTimeout(r, delay))
          delay = Math.min(delay * 2, 5000) // Exponential backoff, max 5s
        }
      }
    }
    
    throw new Error(`Failed after ${maxAttempts} attempts: ${ingestState.lastError}`)
    
  } catch (e: any) {
    const errorMsg = e?.message || String(e)
    ingestState.starting = false
    ingestState.started = false
    ingestState.lastError = errorMsg
    
    log('💥 Boot failed completely', { error: errorMsg })
    return ingestState
  }
}

/**
 * Reset boot state (for development/testing)
 */
export function resetBootState(): void {
  ingestState.started = false
  ingestState.starting = false
  ingestState.lastError = undefined
  ingestState.attempts = 0
  ingestState.lastAttempt = undefined
  console.log('[HCS Boot] State reset')
}

/**
 * Get current boot state (read-only)
 */
export function getBootState(): Readonly<BootState> {
  return { ...ingestState }
}