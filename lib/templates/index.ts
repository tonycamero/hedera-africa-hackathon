import { SIGNAL_TEMPLATE_LIBRARY, type SignalTemplate } from './SignalTemplateLibrary';

/**
 * Canonical template lookup Map for O(1) access
 */
export const templateById = new Map<string, SignalTemplate>(
  SIGNAL_TEMPLATE_LIBRARY.map(template => [template.id, template])
);

/**
 * Get a template by ID with null fallback
 * @param id - Template ID to lookup
 * @returns SignalTemplate or null if not found
 */
export const getTemplate = (id: string): SignalTemplate | null => {
  return templateById.get(id) ?? null;
};

/**
 * Check if a template exists in the library
 * @param id - Template ID to check
 * @returns boolean indicating if template exists
 */
export const templateExists = (id: string): boolean => {
  return templateById.has(id);
};

/**
 * Get all template IDs as array (useful for validation)
 */
export const getAllTemplateIds = (): string[] => {
  return Array.from(templateById.keys());
};

// Re-export everything from library for convenience
export * from './SignalTemplateLibrary';
export * from './TemplateManager';
export * from './SignalTemplateService';
