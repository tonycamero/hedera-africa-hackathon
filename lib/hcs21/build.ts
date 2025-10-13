import { HCS21 } from './enums'

export function buildHcs21<T extends object>(
  typeName: keyof typeof HCS21.TYPE, 
  from: string, 
  nonce: number, 
  payload: T
) {
  return {
    hcs: "21",
    v: HCS21.VERSION,
    type: HCS21.TYPE[typeName],
    from,
    nonce,
    ts: Math.floor(Date.now() / 1000),
    payload
  }
}

// Helper to check if message is HCS-21 format
export function isHcs21Message(message: any): boolean {
  return message?.hcs === "21" && typeof message?.type === 'number'
}

// Extract payload from HCS-21 envelope or return original for legacy
export function extractPayload(message: any): any {
  return isHcs21Message(message) ? (message.payload ?? {}) : message
}

// Extract 'from' field from HCS-21 envelope or legacy format
export function extractFrom(message: any): string | undefined {
  return isHcs21Message(message) ? message.from : message.from
}