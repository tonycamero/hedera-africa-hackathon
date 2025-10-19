'use client';

import { useEffect } from 'react';
import { bootIngestionOnce, addShutdownHandler } from '@/lib/boot/bootIngestion';
import { signalsStore } from '@/lib/stores/signalsStore';
import { shouldBootHCS, getValidTopics, MIRROR_REST, MIRROR_WS, TOPICS, BOOT } from '@/lib/env';

/**
 * Global HCS ingestion initialization component.
 * Uses the new Step 3 ingestion architecture with resilient backfill + streaming.
 */
export default function BootHCSClient() {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Check if we should boot HCS ingestion
        if (!shouldBootHCS()) {
          console.log('[Boot] HCS ingestion disabled by flags/env. Skipping.', {
            BOOT_FLAGS: BOOT,
            VALID_TOPICS: getValidTopics(),
            MIRROR_REST,
            MIRROR_WS
          });
          return;
        }
        
        const validTopics = getValidTopics();
        console.log('🚀 [BootHCSClient] Starting HCS ingestion with Step 3 architecture...');
        console.log('🚀 [BootHCSClient] Environment check:', {
          BOOT_FLAGS: BOOT,
          NODE_ENV: process.env.NODE_ENV,
          MIRROR_REST,
          MIRROR_WS,
          VALID_TOPICS: validTopics,
          ALL_TOPICS: TOPICS
        });

        // Start the new Step 3 ingestion system
        console.log('📡 [BootHCSClient] Booting HCS ingestion (backfill + streaming + recognition two-phase)...');
        await bootIngestionOnce();
        
        console.log('🎉 [BootHCSClient] HCS ingestion system started successfully');
        
        // Add to global scope for debugging
        if (typeof window !== 'undefined') {
          (window as any).signalsStore = signalsStore;
          (window as any).debugStore = {
            // Legacy methods for backward compatibility
            getBonded: (id: string) => signalsStore.getBondedContacts?.(id) || 'getBondedContacts method not available',
            getTrust: (id: string) => signalsStore.getTrustStats?.(id) || 'getTrustStats method not available', 
            getSignals: () => signalsStore.getAll(),
            getRecognition: (id: string) => signalsStore.getRecognitionsFor(id),
            
            // New Step 3 methods
            getScoped: (sessionId: string, scope: 'my' | 'global', type?: string) => 
              signalsStore.getScoped(sessionId, scope, type),
            getSummary: () => signalsStore.getSummary(),
            getByType: (type: string) => signalsStore.getByType(type),
            getByActor: (actor: string) => signalsStore.getByActor(actor),
            getSince: (timestamp: number) => signalsStore.getSince(timestamp),
            
            // Debug and stats
            storeSummary: () => signalsStore.getSummary(),
          };
          
          console.log('🔧 [BootHCSClient] Debug helpers added to window.signalsStore and window.debugStore');
          console.log('🔧 [BootHCSClient] New methods: getScoped(), getSummary(), getByType(), etc.');
          console.log('🔧 [BootHCSClient] Ingestion stats: window.trustmeshIngest.stats()');
          console.log('🔧 [BootHCSClient] Recognition cache: window.trustmeshIngest.recognitionCache()');
        }
        
      } catch (error) {
        console.error('❌ [BootHCSClient] HCS ingestion initialization failed:', error);
        console.error('❌ [BootHCSClient] Error details:', {
          message: error.message,
          stack: error.stack,
          SHOULD_BOOT: shouldBootHCS(),
          BOOT_FLAGS: BOOT
        });
        // Don't throw - let the app continue with empty state
      }
    };

    // Initialize services on mount
    initializeServices();

    // Only set up debug helpers if we should boot HCS
    if (typeof window !== 'undefined' && shouldBootHCS()) {
      (window as any).signalsStore = signalsStore;
      (window as any).debugStore = {
        getSignals: () => signalsStore.getAll(),
        getSummary: () => signalsStore.getSummary(),
        getScoped: (sessionId: string, scope: 'my' | 'global') => 
          signalsStore.getScoped(sessionId, scope)
      };
      console.log('🔧 [BootHCSClient] Debug helpers setup (fallback)');
    }

    // No cleanup function needed - bootIngestionOnce handles its own lifecycle
    return () => {
      // Cleanup is handled by the ingestion boot system
    };
  }, []);

  // This component renders nothing
  return null;
}
