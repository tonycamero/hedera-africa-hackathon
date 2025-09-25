// lib/boot/bootstrapFlex.ts
import { flexRegistry, getFallbackTopics } from "@/lib/services/HCS2RegistryClient";
import { 
  setRegistryNamespace, 
  beginCacheSession, 
  maybeInvalidate,
  loadSignals as cacheLoadSignals, 
  saveSignals as cacheSaveSignals,
  loadDerivedState, 
  saveDerivedState,
  loadRegistrySnapshot, 
  saveRegistrySnapshot,
  clearCache 
} from "@/lib/cache/sessionCache";
import { 
  saveSignalsWithRegistry, 
  loadSignalsWithRegistry 
} from "@/lib/cache/registryCache";
import { hcsFeedService } from "@/lib/services/HCSFeedService";
import { computeDerivedFromSignals } from "@/lib/ux/derive";
import { getSessionId } from "@/lib/session";

export type BootstrapResult = {
  cachedSignals: any[];         // paint immediately
  cachedDerived: any | null;    // counters etc.
  resolvedTopics: Record<string,string>; // after registry
  registryId: string;           // active registry
  freshness: {
    cacheAge: number;           // ms since last cache
    registryAge: number;        // ms since registry snapshot
    isStale: boolean;           // > 15s old
  };
};

export async function bootstrapFlex(): Promise<BootstrapResult> {
  console.log('🚀 [FlexBootstrap] Starting cache-first → registry → mirror sequence...');
  
  // === 1) CACHE HYDRATE (0-5ms) ===
  console.log('📦 [FlexBootstrap] Phase 1: Cache hydrate');
  
  // Session cache lifecycle
  maybeInvalidate();            
  if (!getSessionId()) beginCacheSession(); 

  // Load from registry-aware cache
  const cachedData = loadSignalsWithRegistry();
  const cachedSignals = cachedData?.signals ?? [];
  const signalsMeta = cachedData?.meta;
  const cachedDerived = loadDerivedState();

  console.log(`📦 [FlexBootstrap] Loaded ${cachedSignals.length} cached signals, derived:`, !!cachedDerived);

  // === 2) REGISTRY RESOLVE (50-300ms) ===
  console.log('🔧 [FlexBootstrap] Phase 2: Registry resolve');
  
  // Registry id known from env (read-only)
  const registryId = flexRegistry.getRegistryId() || 
                    process.env.NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID || 
                    "fallback-registry-0.0.simulation";
  
  setRegistryNamespace(registryId);

  // Check if we have registry ID, otherwise use fallback
  if (!process.env.NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID) {
    console.log('⚠️ [FlexBootstrap] No NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID, using fallback topics...');
    const fallbackTopics = getFallbackTopics();
    
    // Initialize HCS services with fallback topics
    await hcsFeedService.initialize();
    
    // For fallback mode, we'll use the verified topics directly
    const topics = fallbackTopics;
    
    return {
      cachedSignals: [],
      cachedDerived: null,
      resolvedTopics: topics,
      registryId: 'fallback-mode',
      freshness: {
        cacheAge: Infinity,
        registryAge: 0,
        isStale: false
      }
    };
  }

  // Initialize HCS services (resolves topics via HCS-2)
  await hcsFeedService.initialize();
  const topics = hcsFeedService.getTopicIds() as any;

  // Compare with registry snapshot to detect rotations
  const snap = loadRegistrySnapshot();
  const topicsChanged = 
    !snap ||
    snap.registryId !== registryId ||
    JSON.stringify(snap.topics) !== JSON.stringify({
      feed: topics.feed, 
      contacts: topics.contacts, 
      trust: topics.trust,
      recognition: topics.recognition, 
      profile: topics.profile, 
      system: topics.system
    });

  console.log('🔧 [FlexBootstrap] Registry check:', {
    registryId,
    topicsChanged,
    snapAge: snap ? Date.now() - snap.updatedAt : 'no-snap'
  });

  if (topicsChanged) {
    console.log('🔄 [FlexBootstrap] Topics changed - clearing chain-scoped cache');
    
    // Chain context changed → clear chain-scoped caches only
    // Keep session flags + sid; drop signals/mirror/derived to avoid cross-topic bleed
    cacheSaveSignals([]); 
    saveDerivedState({ 
      outboundAvail: 9, 
      outboundUsed: 0, 
      inboundTop9Ids: [],
      lastConsensusISO: new Date().toISOString()
    });
    
    saveRegistrySnapshot({
      registryId,
      topics: {
        feed: topics.feed, 
        contacts: topics.contacts, 
        trust: topics.trust,
        recognition: topics.recognition, 
        profile: topics.profile, 
        system: topics.system
      },
      updatedAt: Date.now(),
    });
  }

  // === 3) FRESHNESS CALCULATION ===
  const currentSnap = loadRegistrySnapshot()!; // We just saved it if it didn't exist
  const cacheAge = signalsMeta ? Date.now() - signalsMeta.savedAt : Infinity;
  const registryAge = Date.now() - currentSnap.updatedAt;
  const isStale = cacheAge > 15000; // > 15s

  const freshness = { cacheAge, registryAge, isStale };

  console.log('⏱️ [FlexBootstrap] Freshness:', freshness);

  // === 4) BACKGROUND MIRROR REFRESH (100-1200ms) ===
  console.log('🌐 [FlexBootstrap] Phase 3: Background mirror refresh (async)');
  
  // Kick background refresh (don't await - UI can paint immediately)
  void (async () => {
    try {
      console.log('🌐 [FlexBootstrap] Fetching fresh signals from mirror...');
      const hcsSignals = await hcsFeedService.getAllFeedEvents(); 
      
      // Save with registry context
      saveSignalsWithRegistry(hcsSignals);
      
      const derived = computeDerivedFromSignals(hcsSignals, getSessionId());
      saveDerivedState({
        ...derived,
        lastConsensusISO: new Date().toISOString()
      });
      
      console.log(`🌐 [FlexBootstrap] Background refresh complete: ${hcsSignals.length} signals`);
      
      // TODO: Emit event for UI to refresh if needed
      // window.dispatchEvent(new CustomEvent('flex:signals-updated', { detail: hcsSignals }));
      
    } catch (error) {
      console.warn('🌐 [FlexBootstrap] Background refresh failed:', error);
    }
  })();

  const result: BootstrapResult = { 
    cachedSignals: topicsChanged ? [] : cachedSignals, // Clear cache if topics rotated
    cachedDerived: topicsChanged ? null : cachedDerived,
    resolvedTopics: topics,
    registryId,
    freshness
  };

  console.log('✅ [FlexBootstrap] Bootstrap complete:', {
    signalsCount: result.cachedSignals.length,
    hasDerived: !!result.cachedDerived,
    registryId: result.registryId,
    isStale: result.freshness.isStale
  });

  return result;
}

// Hot-swap handler for registry rotations
export function handleRegistryRotation(newTopics: Record<string, string>) {
  console.log('🔄 [FlexBootstrap] Registry rotation detected:', newTopics);
  
  const registryId = flexRegistry.getRegistryId()!;
  setRegistryNamespace(registryId);
  
  saveRegistrySnapshot({ 
    registryId, 
    topics: newTopics as any, 
    updatedAt: Date.now() 
  });
  
  // Clear chain-scoped cache to avoid cross-topic bleed
  saveSignalsWithRegistry([]);
  saveDerivedState({ 
    outboundAvail: 9, 
    outboundUsed: 0, 
    inboundTop9Ids: [],
    lastConsensusISO: new Date().toISOString()
  });

  // Optionally pull fresh immediately
  void (async () => {
    try {
      const fresh = await hcsFeedService.getAllFeedEvents();
      saveSignalsWithRegistry(fresh);
      
      const derived = computeDerivedFromSignals(fresh, getSessionId());
      saveDerivedState({
        ...derived,
        lastConsensusISO: new Date().toISOString()
      });
      
      console.log('🔄 [FlexBootstrap] Hot-swap refresh complete');
    } catch (error) {
      console.warn('🔄 [FlexBootstrap] Hot-swap refresh failed:', error);
    }
  })();
}