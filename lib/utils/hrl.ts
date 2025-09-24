/**
 * HRL (Hedera Resource Locator) utilities
 * Format: hcs://11/<PROFILE_TOPIC>/<SEQ>
 */

export interface ParsedHRL {
  topic: string
  seq: number
}

/**
 * Parse an HRL string into its components
 * @param hrl HRL string like "hcs://11/0.0.6889641/42"
 * @returns Parsed topic and sequence number
 */
export function parseHrl(hrl: string): ParsedHRL {
  const match = /^hcs:\/\/11\/([^/]+)\/(\d+)$/.exec(hrl.trim())
  if (!match) {
    throw new Error(`Invalid HRL format: ${hrl}`)
  }
  
  return {
    topic: match[1],
    seq: Number(match[2])
  }
}

/**
 * Validate if a string is a valid HRL
 */
export function isValidHrl(hrl: string): boolean {
  try {
    parseHrl(hrl)
    return true
  } catch {
    return false
  }
}

/**
 * Create an HRL from topic and sequence
 */
export function createHrl(topic: string, seq: number): string {
  return `hcs://11/${topic}/${seq}`
}