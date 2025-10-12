/**
 * Self-healing ingestion supervisor with watchdog and auto-restart
 * Handles failures gracefully and ensures ingestion never stays down
 */

type IngestState = {
  running: boolean
  starting: boolean
  lastError?: string
  restarts: number
  since?: string          // last consensus timestamp processed
  lastAttempt?: number
}

const g = globalThis as any
if (!g.__tm_ingest) {
  g.__tm_ingest = { 
    running: false, 
    starting: false, 
    restarts: 0 
  } as IngestState
}
export const ingest = g.__tm_ingest as IngestState

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const jitter = (n: number) => Math.floor(n * (0.8 + Math.random() * 0.4))

export async function ensureIngestion(
  startIngestion: (opts: {
    since?: string
    onSince: (ts: string) => void
    onFatal: (e: any) => void
  }) => Promise<() => Promise<void>>
) {
  if (ingest.running || ingest.starting) {
    return ingest
  }

  ingest.starting = true
  ingest.lastAttempt = Date.now()
  let backoff = 750
  const backoffMax = 8000

  console.log('[SUPERVISOR] Starting ingestion with auto-restart capability')

  while (!ingest.running) {
    try {
      const stop = await startIngestion({
        since: ingest.since,
        onSince: (ts) => { 
          ingest.since = ts
          console.log('[SUPERVISOR] Watermark updated:', ts)
        },
        onFatal: async (e) => {
          console.error('💥 [SUPERVISOR] Fatal error from stream:', e?.message || e)
          ingest.running = false
          ingest.lastError = e?.message || String(e)
          // Trigger restart via liveness loop
        }
      })

      // Arm liveness loop (checks flag and restarts if needed)
      livenessLoop(stop)
      
      ingest.running = true
      ingest.starting = false
      ingest.lastError = undefined
      
      console.log(`✅ [SUPERVISOR] Ingestion started (restarts: ${ingest.restarts})`)
      return ingest
      
    } catch (e: any) {
      ingest.lastError = e?.message || String(e)
      ingest.restarts += 1
      ingest.starting = false
      
      console.error(`❌ [SUPERVISOR] Start failed (attempt ${ingest.restarts}):`, ingest.lastError)
      
      const delay = jitter(backoff)
      console.log(`🔄 [SUPERVISOR] Retrying in ${delay}ms...`)
      
      await sleep(delay)
      backoff = Math.min(backoff * 2, backoffMax)
      ingest.starting = true
    }
  }
  return ingest
}

async function livenessLoop(stop: () => Promise<void>) {
  // Background checker; if running flips false, stop stream and let ensureIngestion() re-start
  (async () => {
    console.log('[SUPERVISOR] Liveness watchdog started')
    
    while (true) {
      await sleep(1500)
      
      if (!ingest.running) {
        console.log('🔄 [SUPERVISOR] Detected failure, stopping streams for restart')
        try { 
          await stop() 
        } catch (e) {
          console.warn('[SUPERVISOR] Error during stream stop:', e)
        }
        break
      }
    }
    
    console.log('[SUPERVISOR] Liveness watchdog stopped')
  })().catch((e) => {
    console.error('[SUPERVISOR] Liveness loop error:', e)
  })
}

export async function stopIngestion() {
  console.log('[SUPERVISOR] Manual stop requested')
  ingest.running = false
}

export function getIngestState(): Readonly<IngestState> {
  return { ...ingest }
}

export function resetIngestState() {
  ingest.running = false
  ingest.starting = false
  ingest.lastError = undefined
  ingest.restarts = 0
  ingest.since = undefined
  ingest.lastAttempt = undefined
  console.log('[SUPERVISOR] State reset')
}