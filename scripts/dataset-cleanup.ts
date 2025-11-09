#!/usr/bin/env tsx
/**
 * Recognition Dataset Cleanup Script
 * Analyzes and reports issues with recognition signals dataset
 * Provides fixes for duplicates, problematic icons, and negative signals
 */

interface RawSignal {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'academic' | 'professional';
  rarity: 'Common' | 'Rare' | 'Legendary';
  _hrl: string;
  _ts: string;
}

interface DatasetIssue {
  type: 'duplicate' | 'negative' | 'icon_mismatch' | 'description_issue';
  signal: RawSignal;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestedFix?: Partial<RawSignal>;
}

// Problematic signals identified
const NEGATIVE_SIGNALS = [
  'brain-rot', 'npc', 'melt', 'ghost', 'lecture-sleeper', 
  'meeting-hog', 'deadline-dodger', 'slack-phantom', 'tryhard'
];

// Duplicate/variant pairs
const DUPLICATE_PAIRS = [
  ['wellness-guru', 'wellness-guru-2'],
  ['training-junkie', 'training-junkie-2']
];

// Icon mismatches (signal_id -> suggested_icon)
const ICON_FIXES: Record<string, string> = {
  'rizz': '😎', // Currently 🧠, should be cool/charismatic
  'problem-solver': '🔧', // Currently ❌, should be tool/solution
  'powerpoint-pro': '📽️', // Currently 📊, should be presentation
  'code-monkey': '💻', // Currently 👨‍💻, optional improvement
  'network-ninja': '🤝', // Currently 🕸️, more professional
};

export class DatasetCleanupAnalyzer {
  private signals: RawSignal[] = [];
  private issues: DatasetIssue[] = [];

  async loadDataset(): Promise<void> {
    try {
      console.log('📥 Loading recognition signals dataset...');
      
      // Load from API (you can also load from local JSON file)
      const response = await fetch('https://trust-mesh-hackathon-p9rj5a0k6.vercel.app/api/recognition');
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Failed to load dataset from API');
      }
      
      this.signals = result.data;
      console.log(`✅ Loaded ${this.signals.length} signals`);
    } catch (error) {
      console.error('❌ Failed to load dataset:', error);
      throw error;
    }
  }

  analyzeDataset(): void {
    console.log('🔍 Analyzing dataset for issues...');
    
    this.findDuplicates();
    this.findNegativeSignals();
    this.findIconMismatches();
    this.findDescriptionIssues();
    
    console.log(`📊 Analysis complete: ${this.issues.length} issues found`);
  }

  private findDuplicates(): void {
    DUPLICATE_PAIRS.forEach(([id1, id2]) => {
      const signal1 = this.signals.find(s => s.id === id1);
      const signal2 = this.signals.find(s => s.id === id2);
      
      if (signal1 && signal2) {
        this.issues.push({
          type: 'duplicate',
          signal: signal2, // Mark the -2 variant as the issue
          severity: 'medium',
          description: `Duplicate/variant of "${signal1.name}" (${id1})`,
          suggestedFix: {
            // Suggest merging or removing the -2 variant
            name: `${signal1.name} v2`,
            description: signal2.description // Keep if different, merge if similar
          }
        });
      }
    });
  }

  private findNegativeSignals(): void {
    NEGATIVE_SIGNALS.forEach(id => {
      const signal = this.signals.find(s => s.id === id);
      if (signal) {
        this.issues.push({
          type: 'negative',
          signal,
          severity: 'high',
          description: 'Negative connotation - should be deprecated on-chain'
        });
      }
    });
  }

  private findIconMismatches(): void {
    Object.entries(ICON_FIXES).forEach(([id, suggestedIcon]) => {
      const signal = this.signals.find(s => s.id === id);
      if (signal && signal.icon !== suggestedIcon) {
        this.issues.push({
          type: 'icon_mismatch',
          signal,
          severity: 'low',
          description: `Icon "${signal.icon}" doesn't match signal intent`,
          suggestedFix: { icon: suggestedIcon }
        });
      }
    });
  }

  private findDescriptionIssues(): void {
    this.signals.forEach(signal => {
      // Check for overly short descriptions
      if (signal.description.length < 10) {
        this.issues.push({
          type: 'description_issue',
          signal,
          severity: 'low',
          description: 'Description too short - needs more context'
        });
      }
      
      // Check for inconsistent tone
      if (signal.description.includes('always ') && signal.category !== 'social') {
        this.issues.push({
          type: 'description_issue',
          signal,
          severity: 'low',
          description: 'Description contains absolute language that may not apply universally'
        });
      }
    });
  }

  generateReport(): string {
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');
    
    let report = `
# Dataset Cleanup Report

## Summary
- **Total Signals**: ${this.signals.length}
- **Total Issues**: ${this.issues.length}
- **High Priority**: ${highIssues.length}
- **Medium Priority**: ${mediumIssues.length}  
- **Low Priority**: ${lowIssues.length}

## High Priority Issues (Action Required)
${highIssues.map(issue => `
### ${issue.signal.name} (${issue.signal.id})
- **Type**: ${issue.type}
- **Issue**: ${issue.description}
- **Category**: ${issue.signal.category}
- **Current**: "${issue.signal.description}" ${issue.signal.icon}
${issue.suggestedFix ? `- **Suggested Fix**: ${JSON.stringify(issue.suggestedFix, null, 2)}` : ''}
`).join('\n')}

## Medium Priority Issues (Consider Fixing)
${mediumIssues.map(issue => `
### ${issue.signal.name} (${issue.signal.id})
- **Type**: ${issue.type}
- **Issue**: ${issue.description}
- **Category**: ${issue.signal.category}
- **Current**: "${issue.signal.description}" ${issue.signal.icon}
${issue.suggestedFix ? `- **Suggested Fix**: ${JSON.stringify(issue.suggestedFix, null, 2)}` : ''}
`).join('\n')}

## Low Priority Issues (Optional)
${lowIssues.map(issue => `
### ${issue.signal.name} (${issue.signal.id})
- **Type**: ${issue.type}
- **Issue**: ${issue.description}
- **Current**: "${issue.signal.description}" ${issue.signal.icon}
${issue.suggestedFix ? `- **Suggested Fix**: ${JSON.stringify(issue.suggestedFix, null, 2)}` : ''}
`).join('\n')}

## Recommended Actions

### 1. On-Chain Deprecation (High Priority)
Publish HCS deprecation messages for these ${highIssues.length} negative signals:
\`\`\`json
${highIssues.map(i => `"${i.signal.id}"`).join(', ')}
\`\`\`

### 2. Duplicate Resolution (Medium Priority)
- Decide whether to merge or remove duplicate variants
- If keeping variants, add proper versioning system

### 3. Icon Updates (Low Priority)
- Update icons to better match signal intent
- Ensure consistency across similar signal types

## Clean Dataset Stats (After Fixes)
- **Signals After Cleanup**: ${this.signals.length - highIssues.length - (mediumIssues.length / 2)} (estimated)
- **Positive Signals Only**: ${this.signals.length - highIssues.length}
- **Rarity Distribution**: 
  - Regular: ${this.signals.filter(s => s.rarity === 'Common').length - highIssues.filter(i => i.signal.rarity === 'Common').length}
  - Heat: ${this.signals.filter(s => s.rarity === 'Rare').length - highIssues.filter(i => i.signal.rarity === 'Rare').length}
  - God-Tier: ${this.signals.filter(s => s.rarity === 'Legendary').length - highIssues.filter(i => i.signal.rarity === 'Legendary').length}
`;
    
    return report;
  }

  generateCleanDataset(): RawSignal[] {
    // Remove negative signals and apply fixes
    return this.signals
      .filter(signal => !NEGATIVE_SIGNALS.includes(signal.id))
      .map(signal => {
        const iconFix = ICON_FIXES[signal.id];
        if (iconFix) {
          return { ...signal, icon: iconFix };
        }
        return signal;
      });
  }
}

// CLI execution
async function main() {
  const analyzer = new DatasetCleanupAnalyzer();
  
  try {
    await analyzer.loadDataset();
    analyzer.analyzeDataset();
    
    const report = analyzer.generateReport();
    const cleanDataset = analyzer.generateCleanDataset();
    
    // Write report to file
    const fs = await import('fs');
    await fs.promises.writeFile('DATASET_CLEANUP_REPORT.md', report);
    await fs.promises.writeFile('recognition-tokens-clean.json', JSON.stringify(cleanDataset, null, 2));
    
    console.log('📄 Report written to: DATASET_CLEANUP_REPORT.md');
    console.log('🗃️ Clean dataset written to: recognition-tokens-clean.json');
    console.log(`✨ Clean dataset contains ${cleanDataset.length} signals`);
    
  } catch (error) {
    console.error('❌ Cleanup analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
