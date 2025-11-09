#!/usr/bin/env node

/**
 * Manual script to restart HCS ingestion
 * This is a workaround to trigger ingestion restart when browser console isn't accessible
 */

console.log('🔄 [RestartIngestion] Attempting to restart HCS ingestion...');

// Since we can't directly import ES modules in a script like this,
// we'll use curl to call an API endpoint that triggers the restart
const { exec } = require('child_process');

const LOCALHOST_URL = 'http://localhost:3000';

async function restartIngestion() {
  try {
    console.log('📡 [RestartIngestion] Checking current ingestion status...');
    
    exec(`curl -s ${LOCALHOST_URL}/api/health/ingestion`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ [RestartIngestion] Failed to check ingestion status:', error);
        return;
      }
      
      try {
        const status = JSON.parse(stdout);
        console.log('📊 [RestartIngestion] Current status:', {
          running: status.ingestion.running,
          healthy: status.ingestion.healthy,
          totalMessages: status.store.total,
          connections: status.ingestion.activeConnections
        });
        
        if (status.ingestion.running) {
          console.log('✅ [RestartIngestion] Ingestion is already running!');
          console.log('💡 [RestartIngestion] To restart, use browser console: window.trustmeshBoot.restart()');
        } else {
          console.log('⚠️ [RestartIngestion] Ingestion is not running.');
          console.log('💡 [RestartIngestion] To start, open the app in browser - BootHCSClient should start automatically');
          console.log('💡 [RestartIngestion] Or use browser console: window.trustmeshBoot.start()');
        }
        
      } catch (parseError) {
        console.error('❌ [RestartIngestion] Failed to parse status response:', parseError);
      }
    });
    
  } catch (error) {
    console.error('❌ [RestartIngestion] Script failed:', error);
  }
}

console.log('🌐 [RestartIngestion] Make sure the dev server is running on localhost:3000');
console.log('🚀 [RestartIngestion] Run: pnpm run dev');
console.log('');

restartIngestion();

// Instructions
console.log('');
console.log('📋 [RestartIngestion] Manual restart instructions:');
console.log('   1. Open http://localhost:3000 in browser');
console.log('   2. Open browser dev console (F12)');
console.log('   3. Run: window.trustmeshBoot.restart()');
console.log('   4. Check: window.trustmeshIngest.stats()');
console.log('');
console.log('🔍 [RestartIngestion] Debug helpers:');
console.log('   - window.signalsStore.getSummary()');
console.log('   - window.trustmeshIngest.stats()');
console.log('   - window.trustmeshBoot.status()');