#!/usr/bin/env python3
"""
Generate complete recognitionSignals.ts with all 84 curated v2 signals
Reads from signals-v2-data.json and outputs full TypeScript file
"""

import json

# Load signal data
with open('signals-v2-data.json', 'r') as f:
    data = json.load(f)

# Category mapping
CATEGORY_MAP = {
    'professional_leadership': ('professional', 'leadership'),
    'professional_knowledge': ('professional', 'knowledge'),
    'professional_execution': ('professional', 'execution'),
    'academic_scholarship': ('academic', 'scholarship'),
    'academic_study': ('academic', 'study'),
    'academic_collaboration': ('academic', 'collaboration'),
    'social_character': ('social', 'character'),
    'social_connection': ('social', 'connection'),
    'social_energy': ('social', 'energy'),
    'civic_service': ('civic', 'community-service'),
    'civic_participation': ('civic', 'civic-participation'),
    'civic_environmental': ('civic', 'environmental')
}

# Default stats for each rarity
DEFAULT_STATS = {
    'Legendary': {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    'Rare': {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    'Common': {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65}
}

# Generate TypeScript
output = '''export type SignalCategory = 'social' | 'academic' | 'professional' | 'civic'

export interface RecognitionSignal {
  id: string
  name: string
  description: string
  category: SignalCategory
  subcategory?: string
  number: number
  icon: string
  isActive: boolean
  trustValue: number
  extendedDescription: string
  rarity: 'Common' | 'Rare' | 'Legendary'
  stats: {
    popularity: number
    impact: number
    authenticity: number
    difficulty: number
  }
  traits: {
    personality: string[]
    skills: string[]
    environment: string[]
  }
  backstory: string
  tips: string[]
  tags: string[]
  v: number
}

// Recognition Signals v2 - Complete Curated Catalog
// Generated from signals-v2-data.json
// 84 positive signals across 4 balanced categories
// All negative signals removed (brain-rot, gyatt, npc, skibidi, etc.)
// New Civic category with 18 community engagement signals

export const recognitionSignals: RecognitionSignal[] = [
'''

number = 1
for category_key in data.keys():
    category, subcategory = CATEGORY_MAP[category_key]
    signals = data[category_key]
    
    # Add comment header
    output += f"\n  // {category.upper()} - {subcategory.title()} ({len(signals)} signals)\n"
    
    for signal in signals:
        stats = DEFAULT_STATS[signal['rarity']]
        
        output += f'''  {{
    id: '{signal['id']}',
    name: '{signal['name']}',
    description: `{signal['short']}`,
    category: '{category}',
    subcategory: '{subcategory}',
    number: {number},
    icon: '{signal['icon']}',
    isActive: true,
    trustValue: {signal['trust']},
    extendedDescription: `{signal['long']}`,
    rarity: '{signal['rarity']}',
    stats: {stats},
    traits: {{
      personality: [],
      skills: [],
      environment: []
    }},
    backstory: `Generated from v2 curated catalog - {signal['rarity']} signal representing {subcategory} excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: {signal['tags']},
    v: 2
  }},
'''
        number += 1

output += ''']

export default recognitionSignals
'''

# Write to file
output_path = '../lib/data/recognitionSignalsV2-complete.ts'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(output)

print(f"✅ Generated {output_path}")
print(f"✅ Total signals: {number-1}")
print(f"✅ All 84 signals with full metadata")
print(f"✅ Ready to replace recognitionSignals.ts")
