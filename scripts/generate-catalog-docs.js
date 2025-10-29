const fs = require('fs');
const path = require('path');

function generateBaseCatalogDoc() {
  const base = JSON.parse(fs.readFileSync('scripts/out/catalog.v2-base.json', 'utf8'));

  let md = '# TrustMesh Recognition Signals - Base Catalog (v2.0)\n\n';
  md += '**Edition:** Base\n';
  md += '**Version:** ' + base.version + '\n';
  md += '**Total Signals:** ' + base.items.length + '\n';
  md += '**Generated:** ' + new Date(base.iat).toISOString() + '\n\n';
  md += '---\n\n';
  md += '## Table of Contents\n\n';

  // Group by category
  const byCategory = {};
  base.items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  // TOC
  Object.keys(byCategory).sort().forEach(category => {
    md += `- [${category.toUpperCase()}](#${category.toLowerCase()}) (${byCategory[category].length} signals)\n`;
  });
  md += '\n---\n\n';

  // Signals by category
  Object.keys(byCategory).sort().forEach(category => {
    md += `## ${category.toUpperCase()} (${byCategory[category].length} signals)\n\n`;
    
    byCategory[category].forEach((signal, idx) => {
      md += `### ${idx + 1}. ${signal.name} ${signal.icon || ''}\n\n`;
      md += `- **ID:** \`${signal.base_id}\`\n`;
      md += `- **Type:** \`${signal.type_id}\`\n`;
      md += `- **Trust Value:** ${signal.trustValue} TRST\n`;
      md += `- **Rarity:** ${signal.rarity}\n`;
      md += `- **Description:** ${signal.description}\n`;
      if (signal.extendedDescription) {
        md += `- **Extended:** ${signal.extendedDescription}\n`;
      }
      if (signal.tags && signal.tags.length > 0) {
        md += `- **Tags:** ${signal.tags.join(', ')}\n`;
      }
      md += '\n';
    });
    md += '\n';
  });

  fs.writeFileSync('docs/RECOGNITION_SIGNALS_BASE_CATALOG.md', md);
  console.log('✅ Created docs/RECOGNITION_SIGNALS_BASE_CATALOG.md');
}

function generateOverlayDoc(edition, title) {
  const filename = `catalog.v2-${edition}.overlay.json`;
  const overlay = JSON.parse(fs.readFileSync(`scripts/out/${filename}`, 'utf8'));

  let md = `# TrustMesh Recognition Signals - ${title} Overlay\n\n`;
  md += `**Edition:** ${edition}\n`;
  md += `**Version:** ${overlay.version}\n`;
  md += `**Total Overlays:** ${overlay.items.length}\n`;
  md += `**Generated:** ${new Date(overlay.iat).toISOString()}\n\n`;
  md += '---\n\n';
  md += '## About This Overlay\n\n';
  md += `This overlay provides culturally-adapted variants for ${overlay.items.length} recognition signals. `;
  md += 'It does NOT define economics (trustValue/rarity) - those come from the base catalog only.\n\n';
  md += '### What Gets Overridden\n';
  md += '- ✅ Name (cultural variant)\n';
  md += '- ✅ Description (cultural context)\n';
  md += '- ✅ Extended description\n';
  md += '- ✅ Icon (if culturally specific)\n';
  md += '- ✅ Tags (cultural keywords)\n\n';
  md += '### What Stays From Base\n';
  md += '- 🔒 Trust Value (economics)\n';
  md += '- 🔒 Rarity (economics)\n';
  md += '- 🔒 Base ID (identity)\n';
  md += '- 🔒 Category (structure)\n\n';
  md += '---\n\n';
  md += '## Overlays\n\n';

  overlay.items.forEach((signal, idx) => {
    md += `### ${idx + 1}. ${signal.name} ${signal.icon || ''}\n\n`;
    md += `- **Base ID:** \`${signal.base_id}\` (maps to base signal)\n`;
    md += `- **Type:** \`${signal.type_id}\`\n`;
    md += `- **Description:** ${signal.description}\n`;
    if (signal.extendedDescription) {
      md += `- **Extended:** ${signal.extendedDescription}\n`;
    }
    if (signal.tags && signal.tags.length > 0) {
      md += `- **Tags:** ${signal.tags.join(', ')}\n`;
    }
    md += '\n';
  });

  const outFilename = `RECOGNITION_SIGNALS_${edition.toUpperCase()}_OVERLAY.md`;
  fs.writeFileSync(`docs/${outFilename}`, md);
  console.log(`✅ Created docs/${outFilename}`);
}

function generateComparisonDoc() {
  const base = JSON.parse(fs.readFileSync('scripts/out/catalog.v2-base.json', 'utf8'));
  const genz = JSON.parse(fs.readFileSync('scripts/out/catalog.v2-genz.overlay.json', 'utf8'));
  const african = JSON.parse(fs.readFileSync('scripts/out/catalog.v2-african.overlay.json', 'utf8'));

  let md = '# Recognition Signals - Cultural Overlay Comparison\n\n';
  md += '**Generated:** ' + new Date().toISOString() + '\n\n';
  md += '---\n\n';
  md += '## Overview\n\n';
  md += `- **Base Signals:** ${base.items.length} (100% coverage)\n`;
  md += `- **GenZ Overlays:** ${genz.items.length} (~${Math.round(genz.items.length / base.items.length * 100)}% coverage)\n`;
  md += `- **African Overlays:** ${african.items.length} (~${Math.round(african.items.length / base.items.length * 100)}% coverage)\n\n`;
  md += '---\n\n';
  md += '## Side-by-Side Comparison\n\n';
  md += 'Showing signals that have cultural overlays:\n\n';

  // Build lookup maps
  const genzMap = {};
  genz.items.forEach(item => { genzMap[item.base_id] = item; });
  
  const africanMap = {};
  african.items.forEach(item => { africanMap[item.base_id] = item; });

  // Find overlaid signals
  const overlaidIds = new Set([...Object.keys(genzMap), ...Object.keys(africanMap)]);

  Array.from(overlaidIds).forEach(baseId => {
    const baseSignal = base.items.find(s => s.base_id === baseId);
    if (!baseSignal) return;

    md += `### ${baseSignal.name}\n\n`;
    md += `**Base ID:** \`${baseId}\`\n\n`;
    
    // Base version
    md += '#### 🌍 Base Version\n';
    md += `- **Name:** ${baseSignal.name}\n`;
    md += `- **Description:** ${baseSignal.description}\n`;
    md += `- **Trust Value:** ${baseSignal.trustValue} TRST\n`;
    md += `- **Rarity:** ${baseSignal.rarity}\n\n`;
    
    // GenZ variant
    if (genzMap[baseId]) {
      md += '#### 🎮 GenZ Variant\n';
      md += `- **Name:** ${genzMap[baseId].name}\n`;
      md += `- **Description:** ${genzMap[baseId].description}\n`;
      if (genzMap[baseId].tags && genzMap[baseId].tags.length > 0) {
        md += `- **Tags:** ${genzMap[baseId].tags.join(', ')}\n`;
      }
      md += '\n';
    }
    
    // African variant
    if (africanMap[baseId]) {
      md += '#### 🌍 African Variant\n';
      md += `- **Name:** ${africanMap[baseId].name}\n`;
      md += `- **Description:** ${africanMap[baseId].description}\n`;
      if (africanMap[baseId].tags && africanMap[baseId].tags.length > 0) {
        md += `- **Tags:** ${africanMap[baseId].tags.join(', ')}\n`;
      }
      md += '\n';
    }
    
    md += '---\n\n';
  });

  fs.writeFileSync('docs/RECOGNITION_SIGNALS_COMPARISON.md', md);
  console.log('✅ Created docs/RECOGNITION_SIGNALS_COMPARISON.md');
}

// Generate all docs
console.log('\n📝 Generating Recognition Signal Documentation...\n');

generateBaseCatalogDoc();
generateOverlayDoc('genz', 'GenZ');
generateOverlayDoc('african', 'African');
generateComparisonDoc();

console.log('\n✅ All documentation generated successfully!\n');
console.log('📁 Files created in docs/:');
console.log('   - RECOGNITION_SIGNALS_BASE_CATALOG.md');
console.log('   - RECOGNITION_SIGNALS_GENZ_OVERLAY.md');
console.log('   - RECOGNITION_SIGNALS_AFRICAN_OVERLAY.md');
console.log('   - RECOGNITION_SIGNALS_COMPARISON.md\n');
