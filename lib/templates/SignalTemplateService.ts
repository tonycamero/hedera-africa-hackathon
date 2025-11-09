/**
 * Signal Template Service
 * 
 * Service layer for querying and filtering signal templates
 * Provides lens-based and context-based template retrieval
 */

import { SIGNAL_TEMPLATE_LIBRARY, type SignalTemplate, type LensType, type TemplateContext } from './SignalTemplateLibrary'

export class SignalTemplateService {
  
  /**
   * Get templates for a specific lens
   */
  static getTemplatesForLens(lens: LensType): SignalTemplate[] {
    return SIGNAL_TEMPLATE_LIBRARY.filter(template => 
      template.lens.includes(lens)
    )
  }
  
  /**
   * Get templates for a specific context within a lens
   */
  static getTemplatesForContext(lens: LensType, context: TemplateContext): SignalTemplate[] {
    return SIGNAL_TEMPLATE_LIBRARY.filter(template => 
      template.lens.includes(lens) && template.context === context
    )
  }
  
  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string, lens?: LensType): SignalTemplate[] {
    let templates = SIGNAL_TEMPLATE_LIBRARY.filter(template => 
      template.category === category
    )
    
    if (lens) {
      templates = templates.filter(template => template.lens.includes(lens))
    }
    
    return templates
  }
  
  /**
   * Search templates by text content
   */
  static searchTemplates(query: string, lens?: LensType): SignalTemplate[] {
    const lowerQuery = query.toLowerCase()
    let templates = SIGNAL_TEMPLATE_LIBRARY.filter(template => 
      template.text.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.examples.some(example => example.toLowerCase().includes(lowerQuery))
    )
    
    if (lens) {
      templates = templates.filter(template => template.lens.includes(lens))
    }
    
    return templates
  }
  
  /**
   * Get random templates from a lens
   */
  static getRandomTemplates(lens: LensType, count: number = 5): SignalTemplate[] {
    const templates = this.getTemplatesForLens(lens)
    const shuffled = [...templates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }
  
  /**
   * Get templates by rarity
   */
  static getTemplatesByRarity(rarity: string, lens?: LensType): SignalTemplate[] {
    let templates = SIGNAL_TEMPLATE_LIBRARY.filter(template => 
      template.rarity === rarity
    )
    
    if (lens) {
      templates = templates.filter(template => template.lens.includes(lens))
    }
    
    return templates
  }
}