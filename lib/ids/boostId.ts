// lib/ids/boostId.ts
// TODO: T4 - Canonical boost ID system

import { createHash } from 'crypto'

export type BoostId = string

/**
 * TODO: T4 - Generate canonical boost ID from signal metadata
 * Creates deterministic ID from: sender, recipient, template, fill, timestamp
 */
export function createBoostId(
  senderAccountId: string,
  recipientAccountId: string,
  template: string,
  fill: string,
  timestamp: number
): BoostId {
  // TODO: Implement deterministic boost ID generation
  // Consider: hash(sender + recipient + template + fill + timestamp)
  const input = `${senderAccountId}:${recipientAccountId}:${template}:${fill}:${timestamp}`
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

/**
 * TODO: T4 - Parse boost ID from various sources (URLs, messages, etc)
 */
export function parseBoostId(source: string): BoostId | null {
  // Extract from boost URLs: /boost/{boostId}
  const urlMatch = source.match(/\/boost\/([a-f0-9]{16})/i)
  if (urlMatch) {
    return urlMatch[1]
  }
  
  // Extract from HCS message payloads
  try {
    const parsed = JSON.parse(source)
    if (parsed.boost_id && isValidBoostId(parsed.boost_id)) {
      return parsed.boost_id
    }
    if (parsed.payload?.boost_id && isValidBoostId(parsed.payload.boost_id)) {
      return parsed.payload.boost_id
    }
  } catch {
    // Not JSON, continue to other checks
  }
  
  // Direct boost ID check
  if (isValidBoostId(source)) {
    return source
  }
  
  return null
}

/**
 * TODO: T4 - Validate boost ID format
 */
export function isValidBoostId(id: string): boolean {
  // TODO: Validate boost ID format (16-char hex string)
  return /^[a-f0-9]{16}$/i.test(id)
}

/**
 * TODO: T4 - Generate shareable boost URL
 */
export function createBoostUrl(boostId: BoostId, baseUrl?: string): string {
  // TODO: Generate shareable boost URL
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/boost/${boostId}`
}