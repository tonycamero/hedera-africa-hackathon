#!/usr/bin/env tsx

/**
 * Updates HCS Recognition Topic with Enhanced Metadata
 * 
 * This script takes all the rich recognition signals from recognitionSignals.ts
 * and publishes them to the HCS recognition topic with full metadata including:
 * - Extended descriptions
 * - Rarity levels
 * - Stats (popularity, impact, authenticity, difficulty)
 * - Traits (personality, skills, environment)
 * - Related links
 * - Backstory
 * - Tips
 */

import { recognitionSignals, type RecognitionSignal } from '../lib/data/recognitionSignals';

// HCS Publishing Configuration
const HCS_RECOGNITION_TOPIC = '0.0.6895261';
const NETWORK = 'testnet';

// Using local API endpoint - no direct Hedera credentials needed

async function publishEnhancedRecognitionSignals() {
  console.log('🚀 Starting HCS Recognition Enhancement');
  console.log(`📡 Target Topic: ${HCS_RECOGNITION_TOPIC}`);
  console.log(`🌐 Network: ${NETWORK}`);
  console.log(`📊 Signals to enhance: ${recognitionSignals.length}`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const signal of recognitionSignals) {
    try {
      console.log(`\n📝 Processing: ${signal.name} (${signal.id})`);
      
      // Create enhanced recognition definition message
      const enhancedDefinition = {
        type: 'recognition_definition_created',
        schema: 'HCS-Recognition-Def@2', // Version 2 with enhanced metadata
        timestamp: new Date().toISOString(),
        data: {
          // Core identification
          id: signal.id,
          slug: signal.id, // Use ID as slug for consistency
          name: signal.name,
          description: signal.description,
          icon: signal.icon,
          
          // Categorization
          category: signal.category,
          number: signal.number,
          isActive: signal.isActive,
          
          // Enhanced metadata
          extendedDescription: signal.extendedDescription,
          rarity: signal.rarity,
          
          // Rich stats
          stats: signal.stats,
          
          // Trait categories
          traits: signal.traits,
          
          // External resources
          relatedLinks: signal.relatedLinks,
          
          // Narrative elements
          backstory: signal.backstory,
          tips: signal.tips,
          
          // System metadata
          enhancementVersion: '2.0',
          enhancedAt: new Date().toISOString(),
          source: 'recognition_enhancement_script'
        }
      };

      // Simulate HCS publishing (replace with actual Hedera SDK call)
      const success = await publishToHCS(enhancedDefinition);
      
      if (success) {
        console.log(`✅ Enhanced: ${signal.name}`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${signal.name}`);
        errorCount++;
      }
      
      // Rate limiting to avoid overwhelming the network
      await delay(200); // 200ms between messages
      
    } catch (error) {
      console.error(`❌ Error processing ${signal.name}:`, error);
      errorCount++;
    }
  }

  console.log('\n🎉 Enhancement Complete!');
  console.log(`✅ Successfully enhanced: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total processed: ${successCount + errorCount}/${recognitionSignals.length}`);
}

async function publishToHCS(message: any): Promise<boolean> {
  // Use the server-side HCS submit endpoint with envelope format
  
  const envelope = {
    type: 'RECOGNITION_DEFINITION',
    from: 'system',
    nonce: Date.now(),
    ts: Math.floor(Date.now() / 1000),
    payload: message.data
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/hcs/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`HTTP ${response.status}: ${error}`);
      return false;
    }

    const result = await response.json();
    console.log(`📡 HCS Message ID: ${result.messageId || 'N/A'}`);
    return true;
    
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Print enhanced signal preview
function printEnhancedPreview() {
  console.log('\n📋 Enhanced Signal Preview:');
  console.log('=' .repeat(50));
  
  const sampleSignal = recognitionSignals.find(s => s.id === 'chad');
  if (sampleSignal) {
    console.log(`🎯 ${sampleSignal.name} (${sampleSignal.rarity})`);
    console.log(`📝 Description: ${sampleSignal.description}`);
    console.log(`📖 Extended: ${sampleSignal.extendedDescription?.substring(0, 100)}...`);
    console.log(`⭐ Stats: P:${sampleSignal.stats.popularity} I:${sampleSignal.stats.impact} A:${sampleSignal.stats.authenticity} D:${sampleSignal.stats.difficulty}`);
    console.log(`🏷️  Traits: ${sampleSignal.traits.personality.slice(0, 2).join(', ')}...`);
    console.log(`💡 Tips: ${sampleSignal.tips.length} available`);
  }
}

// Main execution
async function main() {
  console.log('🎮 HCS Recognition Enhancement Script');
  console.log('====================================');
  
  printEnhancedPreview();
  
  console.log('\n⚠️  WARNING: This will publish enhanced metadata to HCS');
  console.log('   Make sure the development server is running on localhost:3000');
  
  // Add a 3-second delay to allow reading
  console.log('\n⏱️  Starting in 3 seconds...');
  await delay(3000);
  
  await publishEnhancedRecognitionSignals();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { publishEnhancedRecognitionSignals };