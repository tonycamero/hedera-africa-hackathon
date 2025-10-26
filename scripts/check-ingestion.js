#!/usr/bin/env node

// Check ingestion status by calling the health endpoint
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002'

async function checkIngestion() {
  try {
    console.log('🔍 Checking HCS ingestion status...\n')
    
    const response = await fetch(`${BASE_URL}/api/health/ingestion`)
    const data = await response.json()
    
    console.log('📊 Ingestion Stats:')
    console.log('  Running:', data.isRunning ? '✅' : '❌')
    console.log('  Healthy:', data.healthy ? '✅' : '❌')
    console.log('  Active Connections:', data.activeConnections)
    console.log('  Total Messages:', data.totalMessages)
    console.log('  Total Errors:', data.totalErrors)
    console.log('  Recent Activity:', data.recentActivity ? '✅' : '❌')
    console.log('')
    
    console.log('📈 Topic Stats:')
    Object.entries(data.stats || {}).forEach(([topic, stats]) => {
      if (typeof stats === 'object') {
        console.log(`  ${topic}:`)
        console.log(`    Backfilled: ${stats.backfilled}`)
        console.log(`    Streamed: ${stats.streamed}`)
        console.log(`    Failed: ${stats.failed}`)
      }
    })
    console.log('')
    
    console.log('💾 SignalsStore:')
    console.log('  Total Events:', data.signalsStore?.total || 0)
    console.log('  By Source:', JSON.stringify(data.signalsStore?.countsBySource || {}))
    console.log('  By Type:', JSON.stringify(data.signalsStore?.countsByType || {}))
    
    if (!data.isRunning) {
      console.log('\n⚠️  Ingestion is not running. Try triggering it:')
      console.log(`   curl -X POST ${BASE_URL}/api/debug/trigger-ingestion`)
    }
    
  } catch (error) {
    console.error('❌ Failed to check ingestion:', error.message)
    console.log('\n💡 Make sure the dev server is running on', BASE_URL)
  }
}

checkIngestion()
