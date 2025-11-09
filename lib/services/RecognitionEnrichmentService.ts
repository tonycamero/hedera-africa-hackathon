import type { SignalRarity } from '@/lib/types/signals-collectible';

// Recognition signal from API
interface RawRecognitionSignal {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'academic' | 'professional';
  rarity: 'Common' | 'Rare' | 'Legendary';
  _hrl: string;
  _ts: string;
}

// Enhanced signal type with enriched metadata
export interface EnhancedSignalType {
  type_id: string;        // e.g., "delulu@1"
  base_id: string;        // e.g., "delulu"
  version: number;        // 1
  category: 'social' | 'academic' | 'professional';
  name: string;           // display name
  description: string;    // original description
  labels: string[];       // AI-enhanced keywords
  rarity: SignalRarity;
  icon: string;
  content_hash: string;   // sha3-256 of canonical JSON
  created_at: string;
  source: 'recognition_signals';
  metadata: {
    original_rarity: string;
    hrl: string;
    timestamp: string;
  };
}

export class RecognitionEnrichmentService {
  
  /**
   * Transform recognition signal rarity to card system rarity
   */
  private mapRarity(recognitionRarity: string): SignalRarity {
    switch (recognitionRarity) {
      case 'Common':
        return 'Regular';
      case 'Rare':
        return 'Heat';
      case 'Legendary':
        return 'God-Tier';
      default:
        return 'Regular';
    }
  }

  /**
   * Generate enhanced labels from description using pattern matching
   */
  private generateLabels(name: string, description: string, category: string): string[] {
    const labels: string[] = [];
    
    // Base label from name (slugified)
    labels.push(name.toLowerCase().replace(/\s+/g, '-'));
    
    // Category-specific enhancements
    switch (category) {
      case 'social':
        labels.push('social-dynamics');
        if (description.includes('confidence')) labels.push('confidence');
        if (description.includes('energy')) labels.push('positive-energy');
        if (description.includes('smooth')) labels.push('charisma');
        if (description.includes('funny')) labels.push('humor');
        if (description.includes('cool')) labels.push('coolness');
        if (description.includes('quiet')) labels.push('introvert');
        if (description.includes('hype')) labels.push('enthusiasm');
        break;
        
      case 'academic':
        labels.push('academic-achievement');
        if (description.includes('notes')) labels.push('organization');
        if (description.includes('teacher') || description.includes('prof')) labels.push('teacher-relations');
        if (description.includes('study')) labels.push('study-habits');
        if (description.includes('exam')) labels.push('test-performance');
        if (description.includes('library')) labels.push('research');
        break;
        
      case 'professional':
        labels.push('workplace-skills');
        if (description.includes('problem')) labels.push('problem-solving');
        if (description.includes('meeting')) labels.push('communication');
        if (description.includes('code')) labels.push('technical');
        if (description.includes('data')) labels.push('analytics');
        if (description.includes('network')) labels.push('networking');
        if (description.includes('slides') || description.includes('powerpoint')) labels.push('presentations');
        break;
    }
    
    // Rarity-based labels
    if (name.toLowerCase().includes('goat')) {
      labels.push('legendary', 'excellence', 'peak-performance');
    }
    if (name.toLowerCase().includes('rizz')) {
      labels.push('charm', 'attraction', 'social-skills');
    }
    
    // Sentiment analysis labels
    const positiveWords = ['good', 'great', 'best', 'awesome', 'amazing', 'pro', 'master'];
    const negativeWords = ['bad', 'worst', 'fail', 'awkward', 'cringe'];
    
    const lowerDesc = description.toLowerCase();
    const lowerName = name.toLowerCase();
    
    if (positiveWords.some(word => lowerDesc.includes(word) || lowerName.includes(word))) {
      labels.push('positive-trait');
    }
    if (negativeWords.some(word => lowerDesc.includes(word) || lowerName.includes(word))) {
      labels.push('quirky-trait');
    }
    
    // Remove duplicates and return up to 6 labels
    return [...new Set(labels)].slice(0, 6);
  }

  /**
   * Generate content hash for provenance (using simple string hash)
   */
  private generateContentHash(signal: Omit<EnhancedSignalType, 'content_hash'>): string {
    const canonical = JSON.stringify({
      type_id: signal.type_id,
      base_id: signal.base_id,
      version: signal.version,
      category: signal.category,
      name: signal.name,
      description: signal.description,
      labels: signal.labels.sort(), // Sort for deterministic hash
      rarity: signal.rarity,
      icon: signal.icon
    });
    
    // Simple hash function for client-side compatibility
    let hash = 0;
    for (let i = 0; i < canonical.length; i++) {
      const char = canonical.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Transform a single recognition signal into enhanced signal type
   */
  enrichSignal(raw: RawRecognitionSignal): EnhancedSignalType {
    const base_id = raw.id;
    const version = 1;
    const type_id = `${base_id}@${version}`;
    const rarity = this.mapRarity(raw.rarity);
    const labels = this.generateLabels(raw.name, raw.description, raw.category);
    
    const enhanced: Omit<EnhancedSignalType, 'content_hash'> = {
      type_id,
      base_id,
      version,
      category: raw.category,
      name: raw.name,
      description: raw.description,
      labels,
      rarity,
      icon: raw.icon,
      created_at: raw._ts,
      source: 'recognition_signals',
      metadata: {
        original_rarity: raw.rarity,
        hrl: raw._hrl,
        timestamp: raw._ts
      }
    };

    const content_hash = this.generateContentHash(enhanced);

    return {
      ...enhanced,
      content_hash
    };
  }

  /**
   * Transform all recognition signals into enhanced signal types
   */
  async enrichAllSignals(): Promise<EnhancedSignalType[]> {
    try {
      console.log('[RecognitionEnrichment] Fetching recognition signals for enrichment...');
      
      // Use absolute URL for server-side requests
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/recognition`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recognition signals: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid recognition signals response');
      }
      
      const enriched = result.data.map((signal: RawRecognitionSignal) => 
        this.enrichSignal(signal)
      );
      
      console.log(`[RecognitionEnrichment] Enriched ${enriched.length} recognition signals`);
      
      // Log sample enriched signals for debugging
      const samples = enriched.slice(0, 3);
      samples.forEach((signal, i) => {
        console.log(`[RecognitionEnrichment] Sample ${i + 1}:`, {
          type_id: signal.type_id,
          category: signal.category,
          rarity: signal.rarity,
          labels: signal.labels,
          content_hash: signal.content_hash.substring(0, 8) + '...'
        });
      });
      
      return enriched;
    } catch (error) {
      console.error('[RecognitionEnrichment] Failed to enrich signals:', error);
      throw error;
    }
  }

  /**
   * Get enriched signals by category
   */
  async getSignalsByCategory(category: 'social' | 'academic' | 'professional'): Promise<EnhancedSignalType[]> {
    const allSignals = await this.enrichAllSignals();
    return allSignals.filter(signal => signal.category === category);
  }

  /**
   * Get enriched signals by rarity
   */
  async getSignalsByRarity(rarity: SignalRarity): Promise<EnhancedSignalType[]> {
    const allSignals = await this.enrichAllSignals();
    return allSignals.filter(signal => signal.rarity === rarity);
  }

  /**
   * Get statistics about enriched signals
   */
  async getEnrichmentStats() {
    const allSignals = await this.enrichAllSignals();
    
    const stats = {
      total: allSignals.length,
      categories: {
        social: allSignals.filter(s => s.category === 'social').length,
        academic: allSignals.filter(s => s.category === 'academic').length,
        professional: allSignals.filter(s => s.category === 'professional').length
      },
      rarities: {
        Regular: allSignals.filter(s => s.rarity === 'Regular').length,
        Heat: allSignals.filter(s => s.rarity === 'Heat').length,
        Peak: allSignals.filter(s => s.rarity === 'Peak').length,
        'God-Tier': allSignals.filter(s => s.rarity === 'God-Tier').length
      },
      averageLabelsPerSignal: Math.round(
        allSignals.reduce((sum, s) => sum + s.labels.length, 0) / allSignals.length
      )
    };
    
    return stats;
  }
}

export const recognitionEnrichmentService = new RecognitionEnrichmentService();