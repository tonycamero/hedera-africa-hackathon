/**
 * Lens-Aware Recognition Token Resolver
 * 
 * Enforces economics from base catalog while allowing cultural overlays
 * to customize presentation (name, description, icon).
 */

export type Lens = "base" | "genz" | "african"

/**
 * Base recognition token with canonical economics
 */
export interface RecognitionBase {
  base_id: string
  type_id: string
  name: string
  description: string
  icon: string
  tags: string[]
  category: string
  subcategory: string
  // Economics (IMMUTABLE - from base only)
  trustValue: number
  rarity: "Common" | "Rare" | "Legendary"
}

/**
 * Cultural overlay (presentation only - NO ECONOMICS)
 */
export interface RecognitionOverlay {
  base_id: string
  type_id: string
  // Presentation fields (can override base)
  name?: string
  description?: string
  icon?: string
  tags?: string[]
  culturalContext?: string
  // Economics fields are FORBIDDEN in overlays
  // trustValue?: never  // TypeScript will error if present
  // rarity?: never      // TypeScript will error if present
}

/**
 * Resolved token with lens-specific presentation
 */
export interface ResolvedToken extends RecognitionBase {
  culturalVariant: Lens
  culturalContext?: string
}

/**
 * In-memory catalog maps
 */
export interface CatalogMaps {
  base: Map<string, RecognitionBase>
  overlays: {
    genz: Map<string, RecognitionOverlay>
    african: Map<string, RecognitionOverlay>
  }
}

/**
 * Resolve a recognition token through a cultural lens
 * 
 * Economics (trustValue, rarity) ALWAYS come from base.
 * Overlays only provide alternative labels/descriptions.
 * 
 * @param base_id - Canonical signal ID (e.g., "strategic-visionary")
 * @param lens - Cultural lens to apply
 * @param maps - Loaded catalog maps
 * @returns Resolved token or undefined if not found
 */
export function resolveToken(
  base_id: string,
  lens: Lens,
  maps: CatalogMaps
): ResolvedToken | undefined {
  // 1. Get base token (contains economics)
  const base = maps.base.get(base_id)
  if (!base) return undefined

  // 2. Get overlay for requested lens (if available)
  const overlay = lens === "base" 
    ? undefined 
    : maps.overlays[lens]?.get(base_id)

  // 3. Merge: economics from base, labels from overlay (if present)
  return {
    // IMMUTABLE economics from base
    ...base,
    trustValue: base.trustValue,  // Explicit enforcement
    rarity: base.rarity,           // Explicit enforcement
    
    // Presentation fields prefer overlay
    name: overlay?.name ?? base.name,
    description: overlay?.description ?? base.description,
    icon: overlay?.icon ?? base.icon,
    tags: overlay?.tags?.length ? overlay.tags : base.tags,
    
    // Metadata
    culturalVariant: overlay ? lens : "base",
    culturalContext: overlay?.culturalContext,
  }
}

/**
 * Resolve multiple tokens at once (batch operation)
 */
export function resolveTokens(
  base_ids: string[],
  lens: Lens,
  maps: CatalogMaps
): ResolvedToken[] {
  return base_ids
    .map(id => resolveToken(id, lens, maps))
    .filter((token): token is ResolvedToken => token !== undefined)
}

/**
 * Get all tokens for a category with lens applied
 */
export function resolveByCategory(
  category: string,
  lens: Lens,
  maps: CatalogMaps
): ResolvedToken[] {
  const tokens: ResolvedToken[] = []
  
  for (const [base_id, base] of maps.base) {
    if (base.category === category) {
      const resolved = resolveToken(base_id, lens, maps)
      if (resolved) tokens.push(resolved)
    }
  }
  
  return tokens
}

/**
 * Validate that an overlay payload does NOT contain economics
 * Used during catalog ingestion to enforce separation of concerns
 */
export function validateOverlayPayload(items: any[]): { 
  valid: boolean
  errors: string[] 
} {
  const errors: string[] = []
  
  for (const item of items) {
    if ("trustValue" in item) {
      errors.push(`Item ${item.base_id} illegally defines trustValue in overlay`)
    }
    if ("rarity" in item) {
      errors.push(`Item ${item.base_id} illegally defines rarity in overlay`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
