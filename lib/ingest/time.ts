/**
 * Time utilities for HCS consensus timestamp conversion
 */

/**
 * Convert HCS consensus timestamp to milliseconds
 * @param consensusNs Consensus timestamp in "seconds.nanoseconds" format (e.g., "1697040093.123456789")
 * @returns Timestamp in milliseconds or undefined if invalid
 */
export function toMillis(consensusNs?: string): number | undefined {
  if (!consensusNs) return undefined
  
  try {
    // consensus_ns format: "1697040093.123456789" → ms number
    const [sec, nano] = consensusNs.split('.')
    if (!sec) return undefined
    
    const seconds = Number(sec)
    const nanoseconds = nano ? Number('0.' + nano) : 0
    
    if (isNaN(seconds) || isNaN(nanoseconds)) return undefined
    
    const ms = seconds * 1000 + Math.floor(nanoseconds * 1000)
    return ms
  } catch (error) {
    console.warn('[Time] Failed to parse consensus timestamp:', consensusNs, error)
    return undefined
  }
}

/**
 * Get current timestamp in HCS consensus format for testing
 * @returns Current time in "seconds.nanoseconds" format
 */
export function nowAsConsensusNs(): string {
  const now = Date.now()
  const seconds = Math.floor(now / 1000)
  const milliseconds = now % 1000
  const nanoseconds = milliseconds * 1000000 // Convert ms to ns for the fractional part
  return `${seconds}.${nanoseconds.toString().padStart(9, '0')}`
}

/**
 * Compare two consensus timestamps
 * @param a First timestamp
 * @param b Second timestamp
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareConsensusNs(a: string, b: string): number {
  const aMs = toMillis(a)
  const bMs = toMillis(b)
  
  if (aMs === undefined && bMs === undefined) return 0
  if (aMs === undefined) return -1
  if (bMs === undefined) return 1
  
  return aMs - bMs
}