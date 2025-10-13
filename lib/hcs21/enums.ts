export const HCS21 = {
  VERSION: "1.0" as const,
  TYPE: {
    CONTACT_REQUEST: 0,
    CONTACT_ACCEPT: 1,
    CONTACT_REVOKE: 2,
    TRUST_ALLOCATE: 3,
    TRUST_REVOKE: 4,
    RECOGNITION_MINT: 5,
    RECOGNITION_VALIDATE: 6,
  } as const,
} as const

export type Hcs21TypeName = keyof typeof HCS21.TYPE

export const HCS21_TYPE_NAME: Record<number, Hcs21TypeName> = Object.fromEntries(
  Object.entries(HCS21.TYPE).map(([k, v]) => [v, k as Hcs21TypeName])
) as Record<number, Hcs21TypeName>

// Reverse lookup for backward compatibility
export const HCS21_TYPE_TO_STRING: Record<number, string> = {
  0: 'CONTACT_REQUEST',
  1: 'CONTACT_ACCEPT',
  2: 'CONTACT_REVOKE',
  3: 'TRUST_ALLOCATE',
  4: 'TRUST_REVOKE',
  5: 'RECOGNITION_MINT',
  6: 'RECOGNITION_VALIDATE'
}