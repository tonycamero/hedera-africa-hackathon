/**
 * Transaction Telemetry Logger
 * 
 * Logs all Hedera transactions for debugging and audit trail.
 * Client-side: localStorage, Server-side: console + optional DB
 */

export type TxStatus = "SUCCESS" | "PENDING" | "ERROR" | "FAILED" | "ALREADY_ASSOCIATED"
export type TxAction =
  | "PROFILE_CREATE" | "PROFILE_UPDATE"
  | "RECOGNITION_MINT"
  | "TOKEN_ASSOCIATE"
  | "TOPUP_HBAR"
  | "HCS_SUBMIT"
  | "CONTACT_REQUEST" | "CONTACT_ACCEPT"
  | "TRUST_ALLOCATE"

export interface TxLogEvent {
  action: TxAction
  accountId?: string
  txId?: string // Full transaction ID: 0.0.12345@1234567890.123456789
  topicId?: string
  tokenId?: string
  status: TxStatus
  timestamp?: number
  ts?: number // Alias for timestamp
  metadata?: Record<string, any>
  meta?: Record<string, any> // Alias for metadata
}

const TX_LOG_KEY = 'tm_tx_log'
const MAX_CLIENT_LOGS = 100

/**
 * Client-side logging (localStorage)
 */
export function logTxClient(event: TxLogEvent): void {
  if (typeof window === 'undefined') return
  
  try {
    const timestamp = event.timestamp || Date.now()
    const enrichedEvent = { ...event, timestamp }
    
    // Load existing logs
    const existingLogs = loadTxLogsClient()
    
    // Add new log (most recent first)
    const updatedLogs = [enrichedEvent, ...existingLogs].slice(0, MAX_CLIENT_LOGS)
    
    // Save back
    localStorage.setItem(TX_LOG_KEY, JSON.stringify(updatedLogs))
    
    console.log(`[TxLog Client] Logged ${event.action}:`, event.txId)
  } catch (error) {
    console.error('[TxLog Client] Failed to log transaction:', error)
  }
}

/**
 * Load transaction logs from client storage
 */
export function loadTxLogsClient(): TxLogEvent[] {
  if (typeof window === 'undefined') return []
  
  try {
    const raw = localStorage.getItem(TX_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Clear client logs
 */
export function clearTxLogsClient(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TX_LOG_KEY)
}

/**
 * Server-side logging (console + future DB)
 */
export function logTxServer(event: TxLogEvent): void {
  const timestamp = event.timestamp || event.ts || Date.now()
  const metadata = event.metadata || event.meta
  
  // Single-line parseable format (grep-friendly)
  console.log(
    `[txlog] action=${event.action} status=${event.status} txId=${event.txId ?? "-"} account=${event.accountId ?? "-"} topic=${event.topicId ?? "-"} token=${event.tokenId ?? "-"} ts=${timestamp} meta=${JSON.stringify(metadata ?? {})}`
  )
  
  // TODO: Also write to database for persistent audit trail
  // await db.txLog.create({ data: { ...event, timestamp, metadata } })
}

/**
 * Universal logger (detects environment)
 */
export function logTx(event: TxLogEvent): void {
  if (typeof window === 'undefined') {
    logTxServer(event)
  } else {
    logTxClient(event)
  }
}

/**
 * Get recent transactions (last N)
 */
export function getRecentTxs(limit: number = 10): TxLogEvent[] {
  return loadTxLogsClient().slice(0, limit)
}

/**
 * Filter transactions by action type
 */
export function getTxsByAction(action: string): TxLogEvent[] {
  return loadTxLogsClient().filter(tx => tx.action === action)
}

/**
 * Filter transactions by account
 */
export function getTxsByAccount(accountId: string): TxLogEvent[] {
  return loadTxLogsClient().filter(tx => tx.accountId === accountId)
}

/**
 * Get transaction statistics
 */
export function getTxStats(): {
  total: number
  byAction: Record<string, number>
  byStatus: Record<string, number>
  recentFailures: TxLogEvent[]
} {
  const logs = loadTxLogsClient()
  
  const byAction: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  const recentFailures: TxLogEvent[] = []
  
  logs.forEach(tx => {
    byAction[tx.action] = (byAction[tx.action] || 0) + 1
    byStatus[tx.status] = (byStatus[tx.status] || 0) + 1
    
    if (tx.status === 'FAILED') {
      recentFailures.push(tx)
    }
  })
  
  return {
    total: logs.length,
    byAction,
    byStatus,
    recentFailures: recentFailures.slice(0, 5)
  }
}
