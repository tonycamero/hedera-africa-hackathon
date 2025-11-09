// lib/ui/theme.ts
import { GENZ_LENS } from '@/lib/env'

/**
 * Check if GenZ Lens is enabled
 */
export function isGenZ(): boolean {
  return GENZ_LENS
}

/**
 * Get conditional class based on GenZ lens state
 */
export function genzClass(genzClass: string, defaultClass?: string): string {
  return isGenZ() ? genzClass : (defaultClass || '')
}

/**
 * Get theme-specific CSS variables
 */
export function getThemeVars() {
  return {
    'data-theme': isGenZ() ? 'genz' : 'professional'
  }
}