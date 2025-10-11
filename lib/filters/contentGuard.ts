// lib/filters/contentGuard.ts
// TODO: T2 - Implement content guard for GenZ signal templates

export interface ContentGuardResult {
  valid: boolean
  error?: string
  filtered?: string
}

// GenZ Signal Templates (6 edgy positives)
export const GENZ_TEMPLATES = [
  { id: 'clutched', text: 'Clutched ___ under fire', maxFill: 40 },
  { id: 'carried', text: 'Carried the team on ___', maxFill: 40 },
  { id: 'called', text: 'Called it clean on ___', maxFill: 40 },
  { id: 'hardcall', text: 'Made the hard call on ___', maxFill: 40 },
  { id: 'showedup', text: 'Showed up when it counted', maxFill: 40 },
  { id: 'classy', text: 'Kept it classy under pressure', maxFill: 40 }
] as const

export type GenzTemplateId = typeof GENZ_TEMPLATES[number]['id']

/**
 * TODO: T2 - Validate template selection and fill text
 */
export function validateTemplate(templateId: string, fill: string): ContentGuardResult {
  // Check if template ID is valid
  const template = GENZ_TEMPLATES.find(t => t.id === templateId)
  if (!template) {
    return { valid: false, error: 'Invalid template selected' }
  }
  
  // Check fill text length
  if (!fill || fill.trim().length === 0) {
    return { valid: false, error: 'Fill text is required' }
  }
  
  if (fill.length > template.maxFill) {
    return { valid: false, error: `Fill text too long (max ${template.maxFill} characters)` }
  }
  
  // Basic profanity/negativity filter (simple implementation)
  const negativePhrases = ['hate', 'suck', 'terrible', 'awful', 'worst', 'stupid', 'dumb']
  const fillLower = fill.toLowerCase()
  for (const phrase of negativePhrases) {
    if (fillLower.includes(phrase)) {
      return { valid: false, error: 'Keep it positive! Try rephrasing that.' }
    }
  }
  
  return { valid: true }
}

/**
 * TODO: T2 - Validate optional note (positivity + length)
 */
export function validateNote(note: string): ContentGuardResult {
  // Empty note is valid (optional)
  if (!note || note.trim().length === 0) {
    return { valid: true }
  }
  
  // Check length limit
  if (note.length > 120) {
    return { valid: false, error: 'Note too long (max 120 characters)' }
  }
  
  // Basic positivity filter
  const negativePhrases = ['hate', 'suck', 'terrible', 'awful', 'worst', 'stupid', 'dumb', 'fail', 'loser']
  const noteLower = note.toLowerCase()
  for (const phrase of negativePhrases) {
    if (noteLower.includes(phrase)) {
      return { valid: false, error: 'Keep your note positive and encouraging!' }
    }
  }
  
  return { valid: true }
}

/**
 * TODO: T2 - Main content guard entry point
 */
export function guardContent(templateId: string, fill: string, note?: string): ContentGuardResult {
  // Validate template and fill
  const templateResult = validateTemplate(templateId, fill)
  if (!templateResult.valid) {
    return templateResult
  }
  
  // Validate note if provided
  if (note) {
    const noteResult = validateNote(note)
    if (!noteResult.valid) {
      return noteResult
    }
  }
  
  return { valid: true }
}
