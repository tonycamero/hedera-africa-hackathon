// 🔥 Quick Deployment Verification Script
// Run this in DevTools Console on your deployed /circle page

console.log('🚀 [Verification] Starting deployment checks...');

// 1. Environment Check
console.log('[Check] Environment variables:', {
  HCS_ENABLED_type: typeof process?.env?.NEXT_PUBLIC_HCS_ENABLED,
  HCS_ENABLED_raw: process?.env?.NEXT_PUBLIC_HCS_ENABLED,
  REST: process?.env?.NEXT_PUBLIC_MIRROR_NODE_URL,
  WS: process?.env?.NEXT_PUBLIC_MIRROR_NODE_WS,
});

// 2. Check if global debug helpers are available
console.log('[Check] Debug helpers available:', {
  signalsStore: typeof window.signalsStore,
  debugStore: typeof window.debugStore,
  recognitionDebug: typeof window.debugStore?.recognitionDebug,
});

// 3. Check SignalsStore state
if (window.signalsStore) {
  const allSignals = window.signalsStore.getAllSignals();
  console.log('[Check] SignalsStore state:', {
    totalSignals: allSignals?.length || 0,
    sampleSignalTypes: allSignals?.slice(0, 3).map(s => s.type) || [],
  });
}

// 4. Check bonded contacts from store
if (window.debugStore) {
  try {
    const bonded = window.debugStore.getBonded('tm-alex-chen');
    console.log('[Check] Bonded contacts for tm-alex-chen:', {
      count: bonded?.length || 0,
      names: bonded?.map(p => p.name) || [],
    });
  } catch (e) {
    console.log('[Check] Bonded contacts error:', e.message);
  }
}

// 5. Check recognition service if available
if (window.debugStore?.recognitionDebug) {
  try {
    const recDebug = window.debugStore.recognitionDebug();
    console.log('[Check] Recognition service debug:', recDebug);
  } catch (e) {
    console.log('[Check] Recognition debug error:', e.message);
  }
}

// 6. Check for expected log patterns
console.log('🔍 [Verification] Look for these logs in console:');
console.log('  ✅ [BootHCSClient] HCS_ENABLED=true');
console.log('  ✅ [MirrorToStore] Processing N messages...');
console.log('  ✅ [MirrorToStore] Added N events to SignalsStore');
console.log('  ✅ [HCSRecognitionService] definitions: X, instances: Y');

console.log('🎯 [Verification] Complete! Check the output above.');