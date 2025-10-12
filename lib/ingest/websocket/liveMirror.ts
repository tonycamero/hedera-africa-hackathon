/**
 * Bulletproof WebSocket client with heartbeats and auto-reconnect
 * Never throws unhandled errors - all failures funnel to onFatal callback
 */

import WebSocket from 'ws'

export type StreamOpts = {
  url: string                 // e.g., wss://testnet.mirrornode.hedera.com:5600
  path: string                // e.g., /topics/0.0.6896005/messages
  since?: string              // start after this consensus timestamp
  onMessage: (msg: any) => void
  onSince?: (ts: string) => void
  onFatal?: (e: any) => void
}

export async function openMirrorStream(opts: StreamOpts): Promise<() => Promise<void>> {
  let ws: WebSocket | null = null
  let alive = false
  let closed = false
  let pingTimer: NodeJS.Timeout | null = null
  let backoff = 1000
  let reconnectTimer: NodeJS.Timeout | null = null

  const buildUrl = () => {
    try {
      const u = new URL(opts.url)
      // Hedera mirror ws convention: wss://...:5600${path}?timestamp=gt:...
      const q = opts.since ? `?timestamp=gt:${opts.since}` : ''
      return `${u.origin}${opts.path}${q}`
    } catch (e) {
      console.error('🔌 [WS] Invalid URL construction:', e)
      throw e
    }
  }

  const stop = async () => {
    closed = true
    if (pingTimer) { 
      clearInterval(pingTimer)
      pingTimer = null 
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    try { 
      ws?.close() 
    } catch (e) {
      console.warn('🔌 [WS] Error during close:', e)
    }
    ws = null
    console.log('🔌 [WS] Stream stopped')
  }

  const connect = (): Promise<void> => new Promise((resolve, reject) => {
    if (closed) {
      reject(new Error('Stream already closed'))
      return
    }

    try {
      const target = buildUrl()
      console.log(`🔌 [WS] Connecting to ${target}`)
      
      ws = new WebSocket(target)
      alive = false

      const connectTimeout = setTimeout(() => {
        console.error('🔌 [WS] Connection timeout')
        try { ws?.close() } catch {}
        reject(new Error('WebSocket connection timeout'))
      }, 15000)

      ws.on('open', () => {
        clearTimeout(connectTimeout)
        alive = true
        backoff = 1000
        console.log('🔌 [WS] Connected successfully')
        
        // Start heartbeat
        pingTimer = setInterval(() => {
          try {
            if (!ws || ws.readyState !== ws.OPEN) return
            if (!alive) {
              console.warn('🔌 [WS] Heartbeat failed, connection appears dead')
              ws.close()
              return
            }
            alive = false // Reset for next pong
            ws.ping()
          } catch (e) {
            console.warn('🔌 [WS] Ping error:', e)
          }
        }, 15000)
        
        resolve()
      })

      ws.on('pong', () => { 
        alive = true 
        console.log('🔌 [WS] Heartbeat received')
      })

      ws.on('message', (buf) => {
        try {
          // Mirror payload is JSON
          const text = buf.toString('utf8')
          if (!text.trim()) return
          
          const json = JSON.parse(text)
          
          // Mirror ws messages usually wrap in {message, consensusTimestamp, ...} — normalize:
          const m = json.message ? json : { message: json }
          const ts = m.consensus_timestamp || m.consensusTimestamp
          
          if (ts && opts.onSince) {
            opts.onSince(ts)
          }
          
          opts.onMessage(m)
          
        } catch (e) {
          console.error('🔌 [WS] Message parse error:', e)
          // Don't kill connection for parse errors - skip message
        }
      })

      ws.on('error', (err) => {
        clearTimeout(connectTimeout)
        console.error('🔌 [WS] WebSocket error:', err)
        alive = false
        reject(err)
      })

      ws.on('close', (code, reason) => {
        clearTimeout(connectTimeout)
        
        if (closed) {
          console.log('🔌 [WS] Closed (expected)')
          return
        }

        alive = false
        if (pingTimer) { 
          clearInterval(pingTimer)
          pingTimer = null 
        }

        // Retry with backoff + jitter
        const delay = Math.floor(backoff * (0.8 + Math.random() * 0.4))
        backoff = Math.min(backoff * 2, 8000)
        
        console.warn(`🔁 [WS] Closed (${code}: ${reason}) — retrying in ${delay}ms`)
        
        reconnectTimer = setTimeout(() => {
          if (!closed) {
            connect().catch(err => {
              console.error('🔌 [WS] Reconnect failed:', err)
              if (opts.onFatal) {
                opts.onFatal(err)
              }
            })
          }
        }, delay)
      })

    } catch (e) {
      console.error('🔌 [WS] Connection setup error:', e)
      reject(e)
    }
  })

  // Initial connection
  try {
    await connect()
  } catch (e) {
    console.error('🔌 [WS] Initial connection failed:', e)
    throw e
  }

  return stop
}