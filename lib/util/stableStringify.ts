/**
 * Stable JSON stringify for deterministic canonicalization
 * Sorts keys recursively to ensure identical payloads produce identical signatures
 */

export function stableStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj)
  }
  
  if (typeof obj !== 'object') {
    return JSON.stringify(obj)
  }
  
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map(item => 
      typeof item === 'object' && item !== null 
        ? JSON.parse(stableStringify(item))
        : item
    ))
  }
  
  // Sort keys and recursively stringify nested objects
  const keys = Object.keys(obj).sort()
  const sorted: any = {}
  
  for (const k of keys) {
    const val = obj[k]
    sorted[k] = typeof val === 'object' && val !== null
      ? JSON.parse(stableStringify(val))
      : val
  }
  
  return JSON.stringify(sorted)
}
