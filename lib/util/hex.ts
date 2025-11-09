/**
 * Browser-safe hex conversion utilities (no Buffer dependency)
 */

/**
 * Convert Uint8Array to hex string
 */
export function toHex(u8: Uint8Array): string {
  return [...u8].map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * Convert ArrayBuffer or Uint8Array to Uint8Array
 */
export function fromDerToArray(der: ArrayBuffer | Uint8Array): Uint8Array {
  return der instanceof Uint8Array ? der : new Uint8Array(der)
}
