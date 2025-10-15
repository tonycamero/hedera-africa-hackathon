'use client';

import { useEffect } from 'react';
import { bootIngestionOnce, addShutdownHandler } from '@/lib/boot/bootIngestion';
import { signalsStore } from '@/lib/stores/signalsStore';
import { HCS_ENABLED, MIRROR_REST, MIRROR_WS, TOPICS } from '@/lib/env';

/**
 * Global HCS ingestion initialization component.
 * Uses the new Step 3 ingestion architecture with resilient backfill + streaming.
 */
export default function BootHCSClient() {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🚀 [BootHCSClient] Starting HCS ingestion with Step 3 architecture...');
        console.log('🚀 [BootHCSClient] Environment check:', {
          HCS_ENABLED,
          NODE_ENV: process.env.NODE_ENV,
          MIRROR_REST,
          MIRROR_WS,
          TOPICS,
          raw_hcs_enabled: process.env.NEXT_PUBLIC_HCS_ENABLED,
          raw_mirror_rest: process.env.NEXT_PUBLIC_MIRROR_NODE_URL
        });
        
        // Only initialize if HCS is enabled
        if (!HCS_ENABLED) {
          console.warn('🚫 [BootHCSClient] HCS_ENABLED=false, skipping ingestion initialization');
          console.warn('🚫 [BootHCSClient] Raw env value:', process.env.NEXT_PUBLIC_HCS_ENABLED);
          console.warn('🚫 [BootHCSClient] To enable: Set NEXT_PUBLIC_HCS_ENABLED=true in environment');
          return;
        }

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
          HCS_ENABLED
        });
        // Don't throw - let the app continue with empty state
      }
    };

    // Initialize services on mount
    initializeServices();

    // Always set up debug helpers, even if initialization fails
    if (typeof window !== 'undefined') {
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
